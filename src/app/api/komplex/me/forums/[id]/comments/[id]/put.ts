import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { forumComments, forumCommentMedias } from "@/db/drizzle/schema.js";
import { deleteFromCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { sendResponseError, ResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

const ForumCommentMediaKeySchema = z.object({
  key: z.string(),
  url: z.string(),
  mediaType: z.enum(["image", "video"]),
});

export const MeUpdateForumCommentParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MeUpdateForumCommentParams");

export const MeUpdateForumCommentBodySchema = z
  .object({
    description: z.string(),
    mediaKeys: z.array(ForumCommentMediaKeySchema).optional().default([]),
    photosToRemove: z
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
  .openapi("MeUpdateForumCommentBody");

export const MeUpdateForumCommentResponseSchema = z
  .object({
    data: z.object({
      updateComment: z.any(),
      newCommentMedia: z.array(
        z.object({
          url: z.string(),
          mediaType: z.string(),
        })
      ),
    }),
  })
  .openapi("MeUpdateForumCommentResponse");

export const updateForumComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const body = req.body ?? {};
    const description = body.description;
    const mediaKeys: { key: string; url: string; mediaType: string }[] = Array.isArray(body.mediaKeys) ? body.mediaKeys : [];
    let photosToRemoveParse: { url: string }[] = [];
    if (body.photosToRemove) {
      try {
        photosToRemoveParse = typeof body.photosToRemove === "string" ? JSON.parse(body.photosToRemove) : body.photosToRemove;
      } catch {
        throw new ResponseError("Invalid photosToRemove format", 400);
      }
    }

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

    if (photosToRemoveParse.length > 0) {
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

    let newCommentMedia: { url: string; mediaType: string }[] = [];
    const [updateComment] = await db.transaction(async (tx) => {
      for (const { key, url, mediaType } of mediaKeys) {
        const [media] = await tx
          .insert(forumCommentMedias)
          .values({
            forumCommentId: Number(id),
            url,
            urlForDeletion: key,
            mediaType: mediaType === "video" ? "video" : "image",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        newCommentMedia.push({
          url: media.url ?? "",
          mediaType: (media.mediaType ?? "image") as string,
        });
      }

      if (photosToRemoveParse.length > 0) {
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
            await tx
              .delete(forumCommentMedias)
              .where(
                and(
                  eq(forumCommentMedias.forumCommentId, Number(id)),
                  eq(forumCommentMedias.urlForDeletion, urlRow.urlForDeletion)
                )
              );
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
      data: { updateComment, newCommentMedia },
    });
  } catch (error) {
    return sendResponseError(res, error);
  }
};
