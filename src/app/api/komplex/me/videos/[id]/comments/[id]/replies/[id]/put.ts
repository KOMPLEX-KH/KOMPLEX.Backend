import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { videoReplies, videoReplyMedias } from "@/db/drizzle/schema.js";
import {
  uploadVideoToCloudflare,
  deleteFromCloudflare,
} from "@/db/cloudflare/cloudflareFunction.js";
import { sendResponseError, ResponseError } from "@/utils/response.js";
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

    const uploads: { url: string; uniqueKey: string; mimetype: string }[] = [];
    if (files) {
      for (const file of files) {
        const uniqueKey = `${id}-${crypto.randomUUID()}-${file.originalname}`;
        const url = await uploadVideoToCloudflare(
          uniqueKey,
          file.buffer,
          file.mimetype
        );
        uploads.push({ url, uniqueKey, mimetype: file.mimetype });
      }
    }

    if (videosToRemoveParse && videosToRemoveParse.length > 0) {
      for (const mediaToRemove of videosToRemoveParse) {
        const [row] = await db
          .select({ urlForDeletion: videoReplyMedias.urlForDeletion })
          .from(videoReplyMedias)
          .where(eq(videoReplyMedias.url, mediaToRemove.url));
        if (row?.urlForDeletion) {
          await deleteFromCloudflare("komplex-image", row.urlForDeletion);
        }
      }
    }

    let newVideoReplyMedia: any[] = [];
    let deleteMedia: any[] = [];
    const [updateReply] = await db.transaction(async (tx) => {
      for (const { url, uniqueKey, mimetype } of uploads) {
        const [media] = await tx
          .insert(videoReplyMedias)
          .values({
            videoReplyId: Number(id),
            url,
            urlForDeletion: uniqueKey,
            mediaType: mimetype.startsWith("video") ? "video" : "image",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        newVideoReplyMedia.push(media);
      }

      if (videosToRemoveParse && videosToRemoveParse.length > 0) {
        for (const mediaToRemove of videosToRemoveParse) {
          const [urlRow] = await tx
            .select({ urlForDeletion: videoReplyMedias.urlForDeletion })
            .from(videoReplyMedias)
            .where(
              and(
                eq(videoReplyMedias.videoReplyId, Number(id)),
                eq(videoReplyMedias.url, mediaToRemove.url)
              )
            );
          if (urlRow?.urlForDeletion) {
            const deleted = await tx
              .delete(videoReplyMedias)
              .where(
                and(
                  eq(videoReplyMedias.videoReplyId, Number(id)),
                  eq(videoReplyMedias.urlForDeletion, urlRow.urlForDeletion)
                )
              )
              .returning();
            deleteMedia = deleteMedia.concat(deleted);
          }
        }
      }

      const updated = await tx
        .update(videoReplies)
        .set({
          description,
          updatedAt: new Date(),
        })
        .where(eq(videoReplies.id, Number(id)))
        .returning();
      return updated;
    });

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
    return sendResponseError(res, error);
  }
};
