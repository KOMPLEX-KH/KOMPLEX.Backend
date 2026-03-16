import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { forums, forumMedias, users } from "@/db/drizzle/schema.js";
import { deleteFromCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { meilisearch } from "@/config/meilisearch/meilisearchConfig.js";
import { sendResponseError, ResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

const ForumMediaKeySchema = z.object({
  key: z.string(),
  url: z.string(),
  mediaType: z.enum(["image", "video"]),
});

export const MeUpdateForumParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MeUpdateForumParams");

export const MeUpdateForumBodySchema = z
  .object({
    title: z.string(),
    description: z.string(),
    type: z.string().nullable().optional(),
    topic: z.string().nullable().optional(),
    mediaKeys: z.array(ForumMediaKeySchema).optional().default([]),
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
  .openapi("MeUpdateForumBody");

export const MeUpdateForumResponseSchema = z
  .object({
    data: z.object({
      updateForum: z.any(),
      newForumMedia: z.array(
        z.object({
          id: z.number(),
          url: z.string(),
          mediaType: z.string(),
        })
      ),
    }),
  })
  .openapi("MeUpdateForumResponse");

export const updateForum = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const body = req.body ?? {};
    const title = body.title;
    const description = body.description;
    const type = body.type;
    const topic = body.topic;
    const mediaKeys: { key: string; url: string; mediaType: string }[] = Array.isArray(body.mediaKeys) ? body.mediaKeys : [];
    let photosToRemoveParse: { url: string }[] = [];
    if (body.photosToRemove) {
      try {
        photosToRemoveParse = typeof body.photosToRemove === "string" ? JSON.parse(body.photosToRemove) : body.photosToRemove;
      } catch {
        throw new ResponseError("Invalid photosToRemove format", 400);
      }
    }

    const doesUserOwnThisForum = await db
      .select()
      .from(forums)
      .where(and(eq(forums.id, Number(id)), eq(forums.userId, Number(userId))))
      .limit(1);
    if (doesUserOwnThisForum.length === 0) {
      throw new ResponseError("Forum not found", 404);
    }

    if (photosToRemoveParse.length > 0) {
      for (const photoToRemove of photosToRemoveParse) {
        const [urlForDeletionRow] = await db
          .select({ urlForDeletion: forumMedias.urlForDeletion })
          .from(forumMedias)
          .where(
            and(
              eq(forumMedias.forumId, Number(id)),
              eq(forumMedias.url, photoToRemove.url)
            )
          );
        if (urlForDeletionRow?.urlForDeletion) {
          await deleteFromCloudflare("komplex-image", urlForDeletionRow.urlForDeletion);
        }
      }
    }

    const newForumMedia: { id: number; url: string; mediaType: string }[] = [];
    const [updateForumRow] = await db.transaction(async (tx) => {
      for (const { key, url, mediaType } of mediaKeys) {
        const [media] = await tx
          .insert(forumMedias)
          .values({
            forumId: Number(id),
            url,
            urlForDeletion: key,
            mediaType: mediaType === "video" ? "video" : "image",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        newForumMedia.push({ id: media.id, url: media.url ?? '', mediaType: (media.mediaType ?? "image") });
      }

      if (photosToRemoveParse.length > 0) {
        for (const photoToRemove of photosToRemoveParse) {
          const [urlRow] = await tx
            .select({ urlForDeletion: forumMedias.urlForDeletion })
            .from(forumMedias)
            .where(
              and(
                eq(forumMedias.forumId, Number(id)),
                eq(forumMedias.url, photoToRemove.url)
              )
            );
          if (urlRow?.urlForDeletion) {
            await tx
              .delete(forumMedias)
              .where(
                and(
                  eq(forumMedias.forumId, Number(id)),
                  eq(forumMedias.urlForDeletion, urlRow.urlForDeletion)
                )
              );
          }
        }
      }

      const updated = await tx
        .update(forums)
        .set({
          title,
          description,
          type,
          topic,
          updatedAt: new Date(),
        })
        .where(eq(forums.id, Number(id)))
        .returning();
      return updated;
    });

    const forum = await db
      .select({
        id: forums.id,
        userId: forums.userId,
        title: forums.title,
        description: forums.description,
        type: forums.type,
        topic: forums.topic,
        createdAt: forums.createdAt,
        updatedAt: forums.updatedAt,
        mediaUrl: forumMedias.url,
        mediaType: forumMedias.mediaType,
        username: sql`${users.firstName} || ' ' || ${users.lastName}`,
      })
      .from(forums)
      .leftJoin(forumMedias, eq(forums.id, forumMedias.forumId))
      .leftJoin(users, eq(forums.userId, users.id))
      .where(eq(forums.id, Number(id)));

    const forumWithMedia = {
      id: forum[0].id,
      userId: forum[0].userId,
      title: forum[0].title,
      description: forum[0].description,
      type: forum[0].type,
      topic: forum[0].topic,
      createdAt: forum[0].createdAt,
      updatedAt: forum[0].updatedAt,
      username: forum[0]?.username,
      media: forum
        .filter((b) => b.mediaUrl)
        .map((b) => ({ url: b.mediaUrl ?? "", type: b.mediaType ?? "image" })),
    };

    const meilisearchData = {
      id: forumWithMedia.id,
      title: forumWithMedia.title,
      description: forumWithMedia.description,
    };
    await meilisearch.index("forums").addDocuments([meilisearchData]);
    await redis.set(`forums:${id}`, JSON.stringify(forumWithMedia), {
      EX: 600,
    });
    await redis.del(`dashboardData:${userId}`);
    const myForumKeys: string[] = await redis.keys(
      `userForums:${userId}:type:*:topic:*:page:*`
    );
    if (myForumKeys.length > 0) {
      await redis.del(myForumKeys);
    }

    return res.status(200).json({
      data: { updateForum: updateForumRow, newForumMedia },
    });
  } catch (error) {
    return sendResponseError(res, error);
  }
};
