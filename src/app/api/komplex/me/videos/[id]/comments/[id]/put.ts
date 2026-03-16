import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { videoComments, videoCommentMedias } from "@/db/drizzle/schema.js";
import {
  uploadVideoToCloudflare,
  deleteFromCloudflare,
} from "@/db/cloudflare/cloudflareFunction.js";
import { sendResponseError, ResponseError } from "@/utils/response.js";
import crypto from "crypto";
import { z } from "@/config/openapi/openapi.js";

export const MeUpdateVideoCommentParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MeUpdateVideoCommentParams");

export const MeUpdateVideoCommentBodySchema = z
  .object({
    description: z.string(),
    mediasToRemove: z
      .union([
        z.string(),
        z.array(
          z.object({
            url: z.string(),
          })
        ),
      ])
      .optional(),
  })
  .openapi("MeUpdateVideoCommentBody");

export const MeUpdateVideoCommentResponseSchema = z
  .object({
    data: z.object({
      updateComment: z.any(),
      newCommentMedia: z.array(z.any()),
      deleteMedia: z.array(z.any()),
    }),
  })
  .openapi("MeUpdateVideoCommentResponse");

export const updateVideoComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { description, mediasToRemove } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

    const doesUserOwnThisComment = await db
      .select()
      .from(videoComments)
      .where(
        and(
          eq(videoComments.id, Number(id)),
          eq(videoComments.userId, Number(userId))
        )
      )
      .limit(1);

    if (doesUserOwnThisComment.length === 0) {
      throw new ResponseError("Comment not found", 404);
    }

    let mediasToRemoveParse: { url: string }[] = [];
    if (mediasToRemove) {
      try {
        mediasToRemoveParse =
          typeof mediasToRemove === "string"
            ? JSON.parse(mediasToRemove)
            : mediasToRemove;
      } catch (err) {
        throw new ResponseError("Invalid mediasToRemove format", 400);
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

    if (mediasToRemoveParse && mediasToRemoveParse.length > 0) {
      for (const mediaToRemove of mediasToRemoveParse) {
        const [row] = await db
          .select({ urlForDeletion: videoCommentMedias.urlForDeletion })
          .from(videoCommentMedias)
          .where(eq(videoCommentMedias.url, mediaToRemove.url));
        if (row?.urlForDeletion) {
          await deleteFromCloudflare("komplex-image", row.urlForDeletion);
        }
      }
    }

    let newCommentMedia: any[] = [];
    let deleteMedia: any[] = [];
    const [updateComment] = await db.transaction(async (tx) => {
      for (const { url, uniqueKey, mimetype } of uploads) {
        const [media] = await tx
          .insert(videoCommentMedias)
          .values({
            videoCommentId: Number(id),
            url,
            urlForDeletion: uniqueKey,
            mediaType: mimetype.startsWith("video") ? "video" : "image",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        newCommentMedia.push(media);
      }

      if (mediasToRemoveParse && mediasToRemoveParse.length > 0) {
        for (const mediaToRemove of mediasToRemoveParse) {
          const [urlRow] = await tx
            .select({ urlForDeletion: videoCommentMedias.urlForDeletion })
            .from(videoCommentMedias)
            .where(
              and(
                eq(videoCommentMedias.videoCommentId, Number(id)),
                eq(videoCommentMedias.url, mediaToRemove.url)
              )
            );
          if (urlRow?.urlForDeletion) {
            const deleted = await tx
              .delete(videoCommentMedias)
              .where(
                and(
                  eq(videoCommentMedias.videoCommentId, Number(id)),
                  eq(videoCommentMedias.urlForDeletion, urlRow.urlForDeletion)
                )
              )
              .returning();
            deleteMedia = deleteMedia.concat(deleted);
          }
        }
      }

      const updated = await tx
        .update(videoComments)
        .set({
          description,
          updatedAt: new Date(),
        })
        .where(eq(videoComments.id, Number(id)))
        .returning();
      return updated;
    });

    const pattern = `videoComments:video:${updateComment.videoId}:page:*`;
    let cursor = "0";

    do {
      const scanResult = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = scanResult.cursor;
      const keys = scanResult.keys;

      if (keys.length > 0) {
        await Promise.all(keys.map((k) => redis.del(k)));
      }
    } while (cursor !== "0");

    await redis.del(`videoComments:video:${updateComment.videoId}:lastPage`);

    return res.status(200).json({
      data: { updateComment, newCommentMedia, deleteMedia },
    });
  } catch (error) {
    return sendResponseError(res, error);
  }
};
