import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { videoReplies, videoReplyMedias } from "@/db/schema.js";
import {
  uploadVideoToCloudflare,
  deleteFromCloudflare,
} from "@/db/cloudflare/cloudflareFunction.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import crypto from "crypto";

export const updateVideoReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { description, videosToRemove } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

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

    let videosToRemoveParse: { url: string }[] = [];
    if (videosToRemove) {
      try {
        videosToRemoveParse =
          typeof videosToRemove === "string"
            ? JSON.parse(videosToRemove)
            : videosToRemove;
      } catch (err) {
        throw new ResponseError("Invalid videosToRemove format", 400);
      }
    }

    let newVideoReplyMedia: any[] = [];
    if (files) {
      for (const file of files) {
        try {
          const uniqueKey = `${id}-${crypto.randomUUID()}-${file.originalname}`;
          const url = await uploadVideoToCloudflare(
            uniqueKey,
            file.buffer,
            file.mimetype
          );
          const [media] = await db
            .insert(videoReplyMedias)
            .values({
              videoReplyId: Number(id),
              url: url,
              urlForDeletion: uniqueKey,
              mediaType: file.mimetype.startsWith("video") ? "video" : "image",
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          newVideoReplyMedia.push(media);
        } catch (error) {
          throw new ResponseError(error as string, 500);
        }
      }
    }

    let deleteMedia = null;
    if (videosToRemoveParse && videosToRemoveParse.length > 0) {
      const deleteResults = await Promise.all(
        videosToRemoveParse.map(async (mediaToRemove: any) => {
          const [urlForDeletion] = await db
            .select({ urlForDeletion: videoReplyMedias.urlForDeletion })
            .from(videoReplyMedias)
            .where(eq(videoReplyMedias.url, mediaToRemove.url));
          let deleted = null;
          if (urlForDeletion) {
            await deleteFromCloudflare(
              "komplex-image",
              urlForDeletion.urlForDeletion ?? ""
            );
            deleted = await db
              .delete(videoReplyMedias)
              .where(
                and(
                  eq(videoReplyMedias.videoReplyId, Number(id)),
                  eq(
                    videoReplyMedias.urlForDeletion,
                    urlForDeletion.urlForDeletion ?? ""
                  )
                )
              )
              .returning();
          }
          return deleted;
        })
      );
      deleteMedia = deleteResults.flat();
    }

    const [updateReply] = await db
      .update(videoReplies)
      .set({
        description,
        updatedAt: new Date(),
      })
      .where(eq(videoReplies.id, Number(id)))
      .returning();

    const pattern = `videoReplies:comment:${updateReply.videoCommentId}:page:*`;
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
      `videoReplies:comment:${updateReply.videoCommentId}:lastPage`
    );

    return res.status(200).json({
      data: { updateReply, newVideoReplyMedia, deleteMedia },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
