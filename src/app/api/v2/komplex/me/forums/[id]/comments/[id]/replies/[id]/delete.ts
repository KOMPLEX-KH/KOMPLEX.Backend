import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import {
  forumReplies,
  forumReplyLikes,
  forumReplyMedias,
} from "@/db/schema.js";
import { deleteFromCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";

export const deleteForumReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const doesUserOwnThisReply = await db
      .select()
      .from(forumReplies)
      .where(
        and(
          eq(forumReplies.id, Number(id)),
          eq(forumReplies.userId, Number(userId))
        )
      )
      .limit(1);

    if (doesUserOwnThisReply.length === 0) {
      throw new ResponseError("Reply not found", 404);
    }

    const result = await deleteReply(Number(userId), Number(id), null);

    return res.status(200).json({
      data: {
        success: true,
        message: "Reply deleted successfully",
        ...result,
      },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};

export const deleteReply = async (
  userId: number,
  replyId: number | null,
  commentId: number | null
) => {
  try {
    if (replyId === null && commentId === null) {
      throw new ResponseError("Either replyId or commentId must be provided", 400);
    }

    if (replyId && commentId === null) {
      const mediasToDelete = await db
        .select({ urlForDeletion: forumReplyMedias.urlForDeletion })
        .from(forumReplyMedias)
        .where(eq(forumReplyMedias.forumReplyId, replyId));

      for (const media of mediasToDelete) {
        if (media.urlForDeletion) {
          await deleteFromCloudflare("komplex-image", media.urlForDeletion);
        }
      }

      const deletedMedia = await db
        .delete(forumReplyMedias)
        .where(eq(forumReplyMedias.forumReplyId, replyId))
        .returning({
          url: forumReplyMedias.url,
          mediaType: forumReplyMedias.mediaType,
        });

      const deletedLikes = await db
        .delete(forumReplyLikes)
        .where(eq(forumReplyLikes.forumReplyId, replyId))
        .returning();

      const deletedReply = await db
        .delete(forumReplies)
        .where(and(eq(forumReplies.id, replyId), eq(forumReplies.userId, userId)))
        .returning();

      const pattern = `forumReplies:comment:${deletedReply[0].forumCommentId}:page:*`;
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
        `forumReplies:comment:${deletedReply[0].forumCommentId}:lastPage`
      );

      return { deletedReply, deletedMedia, deletedLikes };
    }

    if (commentId && replyId === null) {
      const getReplyIdsByCommentId = await db
        .select({ id: forumReplies.id })
        .from(forumReplies)
        .where(eq(forumReplies.forumCommentId, commentId));
      const replyIds = getReplyIdsByCommentId.map((r) => r.id);

      const mediasToDelete = await db
        .select({ urlForDeletion: forumReplyMedias.urlForDeletion })
        .from(forumReplyMedias)
        .where(
          replyIds.length > 0
            ? inArray(forumReplyMedias.forumReplyId, replyIds)
            : eq(forumReplyMedias.forumReplyId, -1)
        );

      for (const media of mediasToDelete) {
        if (media.urlForDeletion) {
          await deleteFromCloudflare("komplex-image", media.urlForDeletion);
        }
      }

      const deletedMedia = await db
        .delete(forumReplyMedias)
        .where(
          replyIds.length > 0
            ? inArray(forumReplyMedias.forumReplyId, replyIds)
            : eq(forumReplyMedias.forumReplyId, -1)
        )
        .returning();

      const deletedLikes = await db
        .delete(forumReplyLikes)
        .where(
          replyIds.length > 0
            ? inArray(forumReplyLikes.forumReplyId, replyIds)
            : eq(forumReplyLikes.forumReplyId, -1)
        )
        .returning();

      const deletedReply = await db
        .delete(forumReplies)
        .where(
          replyIds.length > 0
            ? inArray(forumReplies.id, replyIds)
            : eq(forumReplies.id, -1)
        )
        .returning();

      const pattern = `forumReplies:comment:${commentId}:page:*`;
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

      await redis.del(`forumReplies:comment:${commentId}:lastPage`);

      return { deletedReply, deletedMedia, deletedLikes };
    }
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};
