import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { forumReplies, forumReplyMedias } from "@/db/schema.js";
import {
  uploadImageToCloudflare,
  deleteFromCloudflare,
} from "@/db/cloudflare/cloudflareFunction.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import crypto from "crypto";

export const updateForumReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { description, photosToRemove } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

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

    let photosToRemoveParse: { url: string }[] = [];
    if (photosToRemove) {
      try {
        photosToRemoveParse = JSON.parse(photosToRemove);
      } catch (err) {
        throw new ResponseError("Invalid photosToRemove format", 400);
      }
    }

    let newReplyMedia: any[] = [];
    if (files) {
      for (const file of files) {
        try {
          const uniqueKey = `${id}-${crypto.randomUUID()}-${file.originalname}`;
          const url = await uploadImageToCloudflare(
            uniqueKey,
            file.buffer,
            file.mimetype
          );
          const [media] = await db
            .insert(forumReplyMedias)
            .values({
              forumReplyId: Number(id),
              url: url,
              urlForDeletion: uniqueKey,
              mediaType: file.mimetype.startsWith("video") ? "video" : "image",
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          newReplyMedia.push(media);
        } catch (error) {
          throw new ResponseError(error as string, 500);
        }
      }
    }

    let deleteMedia = null;
    if (photosToRemoveParse && photosToRemoveParse.length > 0) {
      const deleteResults = await Promise.all(
        photosToRemoveParse.map(async (photoToRemove: any) => {
          const urlForDeletion = await db
            .select({
              urlForDeletion: forumReplyMedias.urlForDeletion,
            })
            .from(forumReplyMedias)
            .where(eq(forumReplyMedias.url, photoToRemove.url));
          let deleted = null;
          if (urlForDeletion[0]?.urlForDeletion) {
            await deleteFromCloudflare(
              "komplex-image",
              urlForDeletion[0].urlForDeletion
            );
            deleted = await db
              .delete(forumReplyMedias)
              .where(
                and(
                  eq(forumReplyMedias.forumReplyId, Number(id)),
                  eq(
                    forumReplyMedias.urlForDeletion,
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

    const [updateReply] = await db
      .update(forumReplies)
      .set({
        description,
        updatedAt: new Date(),
      })
      .where(eq(forumReplies.id, Number(id)))
      .returning();

    const pattern = `forumReplies:comment:${updateReply.forumCommentId}:page:*`;
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
      `forumReplies:comment:${updateReply.forumCommentId}:lastPage`
    );

    return res.status(200).json({
      data: { updateReply, newReplyMedia, deleteMedia },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
