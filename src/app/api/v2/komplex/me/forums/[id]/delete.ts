import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import {
  forums,
  forumMedias,
  forumComments,
  forumReplies,
} from "@/db/schema.js";
import { deleteFromCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { meilisearch } from "@/config/meilisearchConfig.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { deleteReply } from "./comments/[id]/replies/[id]/delete.js";
import { deleteComment } from "./comments/[id]/delete.js";

export const deleteForum = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const doesUserOwnThisForum = await db
      .select()
      .from(forums)
      .where(and(eq(forums.id, Number(id)), eq(forums.userId, Number(userId))))
      .limit(1);

    if (doesUserOwnThisForum.length === 0) {
      throw new ResponseError("Forum not found", 404);
    }

    const mediaToDelete = await db
      .select({
        urlToDelete: forumMedias.urlForDeletion,
      })
      .from(forumMedias)
      .where(eq(forumMedias.forumId, Number(id)));

    if (mediaToDelete && mediaToDelete.length > 0) {
      await Promise.all(
        mediaToDelete.map((media) =>
          deleteFromCloudflare("komplex-image", media.urlToDelete ?? "")
        )
      );
    }

    const deletedMedia = await db
      .delete(forumMedias)
      .where(eq(forumMedias.forumId, Number(id)))
      .returning();

    const commentRecords = await db
      .select()
      .from(forumComments)
      .where(eq(forumComments.forumId, Number(id)));
    let deleteReplies = null;
    let deleteComments = null;
    if (commentRecords.length > 0) {
      for (const commentRecord of commentRecords) {
        deleteReplies = await deleteReply(Number(userId), null, commentRecord.id);
      }
      deleteComments = await deleteComment(Number(userId), null, Number(id));
    }

    const deletedForum = await db
      .delete(forums)
      .where(eq(forums.id, Number(id)))
      .returning();

    await redis.del(`forums:${id}`);
    const myForumKeys: string[] = await redis.keys(
      `userForums:${userId}:type:*:topic:*:page:*`
    );

    if (myForumKeys.length > 0) {
      await redis.del(myForumKeys);
    }
    await redis.del(`dashboardData:${userId}`);

    await meilisearch.index("forums").deleteDocument(String(id));

    return res.status(200).json({
      data: {
        success: true,
        message: "Forum deleted successfully",
        deletedForum,
        deletedMedia,
        deleteReplies,
        deleteComments,
      },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
