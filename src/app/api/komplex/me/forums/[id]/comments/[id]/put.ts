import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { forumComments, forumCommentMedias } from "@/db/schema.js";
import {
  uploadImageToCloudflare,
  deleteFromCloudflare,
} from "@/db/cloudflare/cloudflareFunction.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import crypto from "crypto";

export const updateForumComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { description, photosToRemove } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

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

    let photosToRemoveParse: { url: string }[] = [];
    if (photosToRemove) {
      try {
        photosToRemoveParse = JSON.parse(photosToRemove);
      } catch (err) {
        throw new ResponseError("Invalid photosToRemove format", 400);
      }
    }

    let newCommentMedia: any[] = [];
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
            .insert(forumCommentMedias)
            .values({
              forumCommentId: Number(id),
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
    if (photosToRemoveParse && photosToRemoveParse.length > 0) {
      const deleteResults = await Promise.all(
        photosToRemoveParse.map(async (photoToRemove: any) => {
          const urlForDeletion = await db
            .select({
              urlForDeletion: forumCommentMedias.urlForDeletion,
            })
            .from(forumCommentMedias)
            .where(eq(forumCommentMedias.url, photoToRemove.url));
          let deleted = null;
          if (urlForDeletion[0]?.urlForDeletion) {
            await deleteFromCloudflare(
              "komplex-image",
              urlForDeletion[0].urlForDeletion
            );
            deleted = await db
              .delete(forumCommentMedias)
              .where(
                and(
                  eq(forumCommentMedias.forumCommentId, Number(id)),
                  eq(
                    forumCommentMedias.urlForDeletion,
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
      .update(forumComments)
      .set({
        description,
        updatedAt: new Date(),
      })
      .where(eq(forumComments.id, Number(id)))
      .returning();

    const pattern = `forumComments:forum:${updateComment.forumId}:page:*`;
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

    await redis.del(`forumComments:forum:${updateComment.forumId}:lastPage`);

    return res.status(200).json({
      data: { updateComment, newCommentMedia, deleteMedia },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
