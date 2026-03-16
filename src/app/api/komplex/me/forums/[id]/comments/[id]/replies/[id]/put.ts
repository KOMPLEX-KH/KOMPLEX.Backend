import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { forumReplies, forumReplyMedias } from "@/db/drizzle/schema.js";
import { deleteFromCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { sendResponseError, ResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

const ForumReplyMediaKeySchema = z.object({
  key: z.string(),
  url: z.string(),
  mediaType: z.enum(["image", "video"]),
});

export const MeUpdateForumReplyParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MeUpdateForumReplyParams");

export const MeUpdateForumReplyBodySchema = z
  .object({
    description: z.string(),
    mediaKeys: z.array(ForumReplyMediaKeySchema).optional().default([]),
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
  .openapi("MeUpdateForumReplyBody");

export const MeUpdateForumReplyResponseSchema = z
  .object({
    data: z.object({
      updateReply: z.any(),
      newReplyMedia: z.array(
        z.object({
          url: z.string(),
          mediaType: z.string(),
        })
      ),
    }),
  })
  .openapi("MeUpdateForumReplyResponse");

export const updateForumReply = async (
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

    if (photosToRemoveParse.length > 0) {
      for (const photoToRemove of photosToRemoveParse) {
        const [row] = await db
          .select({ urlForDeletion: forumReplyMedias.urlForDeletion })
          .from(forumReplyMedias)
          .where(eq(forumReplyMedias.url, photoToRemove.url));
        if (row?.urlForDeletion) {
          await deleteFromCloudflare("komplex-image", row.urlForDeletion);
        }
      }
    }

    let newReplyMedia: { url: string; mediaType: string }[] = [];
    const [updateReply] = await db.transaction(async (tx) => {
      for (const { key, url, mediaType } of mediaKeys) {
        const [media] = await tx
          .insert(forumReplyMedias)
          .values({
            forumReplyId: Number(id),
            url,
            urlForDeletion: key,
            mediaType: mediaType === "video" ? "video" : "image",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        newReplyMedia.push({
          url: media.url ?? "",
          mediaType: (media.mediaType ?? "image") as string,
        });
      }

      if (photosToRemoveParse.length > 0) {
        for (const photoToRemove of photosToRemoveParse) {
          const [urlRow] = await tx
            .select({ urlForDeletion: forumReplyMedias.urlForDeletion })
            .from(forumReplyMedias)
            .where(
              and(
                eq(forumReplyMedias.forumReplyId, Number(id)),
                eq(forumReplyMedias.url, photoToRemove.url)
              )
            );
          if (urlRow?.urlForDeletion) {
            await tx
              .delete(forumReplyMedias)
              .where(
                and(
                  eq(forumReplyMedias.forumReplyId, Number(id)),
                  eq(forumReplyMedias.urlForDeletion, urlRow.urlForDeletion)
                )
              );
          }
        }
      }

      const updated = await tx
        .update(forumReplies)
        .set({
          description,
          updatedAt: new Date(),
        })
        .where(eq(forumReplies.id, Number(id)))
        .returning();
      return updated;
    });

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
      data: { updateReply, newReplyMedia },
    });
  } catch (error) {
    return sendResponseError(res, error);
  }
};
