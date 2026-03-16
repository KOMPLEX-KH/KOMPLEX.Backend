import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { forums, forumMedias, users } from "@/db/drizzle/schema.js";
import { meilisearch } from "@/config/meilisearch/meilisearchConfig.js";
import { sendResponseError, sendResponseSuccess, ResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

const ForumMediaKeySchema = z.object({
  key: z.string(),
  url: z.string(),
  mediaType: z.enum(["image", "video"]),
});

export const MePostForumBodySchema = z
  .object({
    title: z.string(),
    description: z.string(),
    type: z.string().optional(),
    topic: z.string().optional(),
    mediaKeys: z.array(ForumMediaKeySchema).optional().default([]),
  })
  .openapi("MePostForumBody");

export const postForum = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { title, description, type, topic, mediaKeys } = await MePostForumBodySchema.parseAsync(req.body ?? {});

    if (!userId) {
      sendResponseError(res, new ResponseError("Missing required user", 400));
      return;
    }

    const newForumMedia: { id: number; url: string; mediaType: string }[] = [];
    const [newForum] = await db.transaction(async (tx) => {
      const [forum] = await tx
        .insert(forums)
        .values({
          userId: Number(userId),
          title,
          description,
          type,
          topic,
          viewCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      for (const { key, url, mediaType } of mediaKeys) {
        const [media] = await tx
          .insert(forumMedias)
          .values({
            forumId: forum.id,
            url,
            urlForDeletion: key,
            mediaType,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        newForumMedia.push({ id: media.id, url: media.url ?? '', mediaType: (media.mediaType ?? "image") as string });
      }
      return [forum];
    });

    const [username] = await db
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, Number(userId)));

    const forumWithMedia = {
      id: newForum.id,
      userId: newForum.userId,
      title: newForum.title,
      description: newForum.description,
      type: newForum.type,
      topic: newForum.topic,
      viewCount: newForum.viewCount,
      createdAt: newForum.createdAt,
      updatedAt: newForum.updatedAt,
      username: username ? `${username.firstName ?? ""} ${username.lastName ?? ""}`.trim() : "",
      isSave: false,
      media: newForumMedia.map((m) => ({ url: m.url, type: m.mediaType })),
    };

    const redisKey = `forums:${newForum.id}`;
    const meilisearchData = {
      id: forumWithMedia.id,
      title: forumWithMedia.title,
      description: forumWithMedia.description,
    };

    await meilisearch.index("forums").addDocuments([meilisearchData]);
    await redis.set(redisKey, JSON.stringify(forumWithMedia), { EX: 600 });
    await redis.del(`dashboardData:${userId}`);

    const myForumKeys: string[] = await redis.keys(
      `userForums:${userId}:type:*:topic:*:page:*`
    );
    if (myForumKeys.length > 0) {
      await redis.del(myForumKeys);
    }

    return sendResponseSuccess(res, forumWithMedia, "Forum posted successfully");
  } catch (error) {
    return sendResponseError(res, error);
  }
};
