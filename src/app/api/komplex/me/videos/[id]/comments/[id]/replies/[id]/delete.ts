import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { videoReplies, videoReplyMedias, videoReplyLike } from "@/db/drizzle/schema.js";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { deleteFromCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { redis } from "@/db/redis/redis.js";

export const deleteVideoReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const [doesUserOwnThisReply] = await db
      .select()
      .from(videoReplies)
      .where(
        and(
          eq(videoReplies.id, Number(id)),
          eq(videoReplies.userId, Number(userId))
        )
      )
      .limit(1);

    if (!doesUserOwnThisReply) {
      throw new ResponseError("Video reply not found", 404);
    }

    const result = await deleteReplyInternal(
      Number(userId),
      Number(id),
      null
    );

    return res.status(200).json({
      data: {
        success: true,
        message: "Video reply deleted successfully",
        ...result,
      },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};

export const deleteReplyInternal = async (
  userId: number,
  videoReplyId: number | null,
  commentId: number | null
) => {
  try {
    if (videoReplyId === null && commentId === null) {
      throw new ResponseError("Either videoReplyId or commentId must be provided", 400);
    }

    if (videoReplyId && commentId === null) {
      const mediaToDelete = await db
        .select({ urlForDeletion: videoReplyMedias.urlForDeletion })
        .from(videoReplyMedias)
        .where(eq(videoReplyMedias.videoReplyId, videoReplyId));

      for (const media of mediaToDelete) {
        await deleteFromCloudflare("komplex-image", media.urlForDeletion ?? "");
      }

      const deletedMedia = await db
        .delete(videoReplyMedias)
        .where(eq(videoReplyMedias.videoReplyId, videoReplyId))
        .returning({
          url: videoReplyMedias.url,
          mediaType: videoReplyMedias.mediaType,
        });
      const deleteLikeReply = await db
        .delete(videoReplyLike)
        .where(eq(videoReplyLike.videoReplyId, videoReplyId))
        .returning();
      const deletedReply = await db
        .delete(videoReplies)
        .where(
          and(eq(videoReplies.id, videoReplyId), eq(videoReplies.userId, userId))
        )
        .returning();

      const pattern = `videoReplies:comment:${deletedReply[0]?.videoCommentId}:page:*`;
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
        `videoReplies:comment:${deletedReply[0]?.videoCommentId}:lastPage`
      );

      return { deletedReply, deletedMedia, deleteLikeReply };
    }

    if (commentId && videoReplyId === null) {
      const getVideoReplyIdByCommentId = await db
        .select({ id: videoReplies.id })
        .from(videoReplies)
        .where(eq(videoReplies.videoCommentId, commentId));
      const videoReplyIds = getVideoReplyIdByCommentId.map((r) => r.id);

      const mediaToDelete = await db
        .select({ urlForDeletion: videoReplyMedias.urlForDeletion })
        .from(videoReplyMedias)
        .where(
          videoReplyIds.length > 0
            ? inArray(videoReplyMedias.videoReplyId, videoReplyIds)
            : eq(videoReplyMedias.videoReplyId, -1)
        );

      for (const media of mediaToDelete) {
        await deleteFromCloudflare("komplex-image", media.urlForDeletion ?? "");
      }

      const deletedMedia = await db
        .delete(videoReplyMedias)
        .where(
          videoReplyIds.length > 0
            ? inArray(videoReplyMedias.videoReplyId, videoReplyIds)
            : eq(videoReplyMedias.videoReplyId, -1)
        )
        .returning({
          url: videoReplyMedias.url,
          mediaType: videoReplyMedias.mediaType,
        });
      const deleteLikeReply = await db
        .delete(videoReplyLike)
        .where(
          videoReplyIds.length > 0
            ? inArray(videoReplyLike.videoReplyId, videoReplyIds)
            : eq(videoReplyLike.videoReplyId, -1)
        )
        .returning();
      const deletedReply = await db
        .delete(videoReplies)
        .where(
          videoReplyIds.length > 0
            ? inArray(videoReplies.id, videoReplyIds)
            : eq(videoReplies.id, -1)
        )
        .returning();

      const pattern = `videoReplies:comment:${commentId}:page:*`;
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
      await redis.del(`videoReplies:comment:${commentId}:lastPage`);

      return { deletedReply, deletedMedia, deleteLikeReply };
    }
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};
