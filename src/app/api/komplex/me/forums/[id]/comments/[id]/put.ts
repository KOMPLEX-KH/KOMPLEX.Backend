import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { forumComments, forumCommentMedias } from "@/db/drizzle/schema.js";
import {
  uploadImageToCloudflare,
  deleteFromCloudflare,
} from "@/db/cloudflare/cloudflareFunction.js";
import { sendResponseError, ResponseError } from "@/utils/response.js";
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

    const uploads: { url: string; uniqueKey: string; mimetype: string }[] = [];
    if (files) {
      for (const file of files) {
        const uniqueKey = `${id}-${crypto.randomUUID()}-${file.originalname}`;
        const url = await uploadImageToCloudflare(
          uniqueKey,
          file.buffer,
          file.mimetype
        );
        uploads.push({ url, uniqueKey, mimetype: file.mimetype });
      }
    }

    if (photosToRemoveParse && photosToRemoveParse.length > 0) {
      for (const photoToRemove of photosToRemoveParse) {
        const [row] = await db
          .select({ urlForDeletion: forumCommentMedias.urlForDeletion })
          .from(forumCommentMedias)
          .where(eq(forumCommentMedias.url, photoToRemove.url));
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
          .insert(forumCommentMedias)
          .values({
            forumCommentId: Number(id),
            url,
            urlForDeletion: uniqueKey,
            mediaType: mimetype.startsWith("video") ? "video" : "image",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        newCommentMedia.push(media);
      }

      if (photosToRemoveParse && photosToRemoveParse.length > 0) {
        for (const photoToRemove of photosToRemoveParse) {
          const [urlRow] = await tx
            .select({ urlForDeletion: forumCommentMedias.urlForDeletion })
            .from(forumCommentMedias)
            .where(
              and(
                eq(forumCommentMedias.forumCommentId, Number(id)),
                eq(forumCommentMedias.url, photoToRemove.url)
              )
            );
          if (urlRow?.urlForDeletion) {
            const deleted = await tx
              .delete(forumCommentMedias)
              .where(
                and(
                  eq(forumCommentMedias.forumCommentId, Number(id)),
                  eq(forumCommentMedias.urlForDeletion, urlRow.urlForDeletion)
                )
              )
              .returning();
            deleteMedia = deleteMedia.concat(deleted);
          }
        }
      }

      const updated = await tx
        .update(forumComments)
        .set({
          description,
          updatedAt: new Date(),
        })
        .where(eq(forumComments.id, Number(id)))
        .returning();
      return updated;
    });

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
    return sendResponseError(res, error);
  }
};
