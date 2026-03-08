import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import {
  forumComments,
  forumCommentMedias,
  forumCommentLikes,
  forumReplies,
} from "@/db/drizzle/schema.js";
import { deleteFromCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { deleteReply } from "./replies/[id]/delete.js";

export const deleteForumComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const doesUserOwnThisComment = await db
      .select()
      .from(forumComments)
      .where(
        and(
          eq(forumComments.id, Number(id)),
          eq(forumComments.userId, Number(userId))
        )
      )
      .limit(1);

    if (doesUserOwnThisComment.length === 0) {
      throw new ResponseError("Comment not found", 404);
    }

    const doesThisCommentHasReply = await db
      .select()
      .from(forumReplies)
      .where(eq(forumReplies.forumCommentId, Number(id)));
    let replyResults = null;
    if (doesThisCommentHasReply.length > 0) {
      replyResults = await deleteReply(Number(userId), null, Number(id));
    }
    const commentResults = await deleteComment(Number(userId), Number(id), null);

    return res.status(200).json({
      data: {
        success: true,
        message: "Comment deleted successfully",
        replyResults,
        commentResults,
      },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};

export const deleteComment = async (
  userId: number,
  commentId: number | null,
  forumId: number | null
) => {
  if (commentId === null && forumId === null) {
    throw new ResponseError("Either commentId or forumId must be provided", 400);
  }

  if (commentId && forumId === null) {
    const mediasToDelete = await db
      .select({ urlForDeletion: forumCommentMedias.urlForDeletion })
      .from(forumCommentMedias)
      .where(eq(forumCommentMedias.forumCommentId, commentId));

    for (const media of mediasToDelete) {
      if (media.urlForDeletion) {
        await deleteFromCloudflare("komplex-image", media.urlForDeletion);
      }
    }

    const deletedMedia = await db
      .delete(forumCommentMedias)
      .where(eq(forumCommentMedias.forumCommentId, commentId))
      .returning({
        url: forumCommentMedias.url,
        mediaType: forumCommentMedias.mediaType,
      });

    const deletedLikes = await db
      .delete(forumCommentLikes)
      .where(eq(forumCommentLikes.forumCommentId, commentId))
      .returning();

    const deletedComment = await db
      .delete(forumComments)
      .where(
        and(eq(forumComments.id, commentId), eq(forumComments.userId, userId))
      )
      .returning();

    const pattern = `forumComments:forum:${deletedComment[0].forumId}:page:*`;
    let cursor = "0";

    do {
      const scanResult = await redis.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });
      cursor = scanResult.cursor;
      const keys = scanResult.keys;

      if (keys.length > 0) {
        await Promise.all(keys.map((k) => redis.del(k)));
      }
    } while (cursor !== "0");

    await redis.del(
      `forumComments:forum:${deletedComment[0].forumId}:lastPage`
    );

    return { deletedComment, deletedMedia, deletedLikes };
  }

  if (forumId && commentId === null) {
    const getCommentIdsByForumId = await db
      .select({ id: forumComments.id })
      .from(forumComments)
      .where(eq(forumComments.forumId, forumId));
    const commentIds = getCommentIdsByForumId.map((c) => c.id);

    const mediasToDelete = await db
      .select({ urlForDeletion: forumCommentMedias.urlForDeletion })
      .from(forumCommentMedias)
      .where(
        commentIds.length > 0
          ? inArray(forumCommentMedias.forumCommentId, commentIds)
          : eq(forumCommentMedias.forumCommentId, -1)
      );

    for (const media of mediasToDelete) {
      if (media.urlForDeletion) {
        await deleteFromCloudflare("komplex-image", media.urlForDeletion);
      }
    }

    const deletedMedia = await db
      .delete(forumCommentMedias)
      .where(
        commentIds.length > 0
          ? inArray(forumCommentMedias.forumCommentId, commentIds)
          : eq(forumCommentMedias.forumCommentId, -1)
      )
      .returning();

    const deletedLikes = await db
      .delete(forumCommentLikes)
      .where(
        commentIds.length > 0
          ? inArray(forumCommentLikes.forumCommentId, commentIds)
          : eq(forumCommentLikes.forumCommentId, -1)
      )
      .returning();

    const deletedComment = await db
      .delete(forumComments)
      .where(
        commentIds.length > 0
          ? inArray(forumComments.id, commentIds)
          : eq(forumComments.id, -1)
      )
      .returning();

    const pattern = `forumComments:forum:${deletedComment[0].forumId}:page:*`;
    let cursor = "0";

    do {
      const scanResult = await redis.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });
      cursor = scanResult.cursor;
      const keys = scanResult.keys;

      if (keys.length > 0) {
        await Promise.all(keys.map((k) => redis.del(k)));
      }
    } while (cursor !== "0");

    await redis.del(
      `forumComments:forum:${deletedComment[0].forumId}:lastPage`
    );

    return { deletedComment, deletedMedia, deletedLikes };
  }
};
