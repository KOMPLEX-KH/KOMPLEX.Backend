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
import { getResponseError, ResponseError } from "@/utils/response.js";
import crypto from "crypto";

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

    let newCommentMedia: any[] = [];
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
            .insert(videoCommentMedias)
            .values({
              videoCommentId: Number(id),
              url: url,
              urlForDeletion: uniqueKey,
              mediaType: file.mimetype.startsWith("video") ? "video" : "image",
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          newCommentMedia.push(media);
        } catch (error) {
          throw new ResponseError(error as string, 500);
        }
      }
    }

    let deleteMedia = null;
    if (mediasToRemoveParse && mediasToRemoveParse.length > 0) {
      const deleteResults = await Promise.all(
        mediasToRemoveParse.map(async (mediaToRemove: any) => {
          const urlForDeletion = await db
            .select({ urlForDeletion: videoCommentMedias.urlForDeletion })
            .from(videoCommentMedias)
            .where(eq(videoCommentMedias.url, mediaToRemove.url));
          let deleted = null;
          if (urlForDeletion[0]?.urlForDeletion) {
            await deleteFromCloudflare(
              "komplex-image",
              urlForDeletion[0].urlForDeletion
            );
            deleted = await db
              .delete(videoCommentMedias)
              .where(
                and(
                  eq(videoCommentMedias.videoCommentId, Number(id)),
                  eq(
                    videoCommentMedias.urlForDeletion,
                    urlForDeletion[0].urlForDeletion
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

    const [updateComment] = await db
      .update(videoComments)
      .set({
        description,
        updatedAt: new Date(),
      })
      .where(eq(videoComments.id, Number(id)))
      .returning();

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
    return getResponseError(res, error);
  }
};
