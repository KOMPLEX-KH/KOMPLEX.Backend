import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { forums, forumMedias, users } from "@/db/schema.js";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

const UserForumMediaSchema = z.object({
  url: z.string(),
  type: z.string(),
});

const UserForumItemSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  type: z.string(),
  topic: z.string().nullable().optional(),
  viewCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  username: z.string(),
  media: z.array(UserForumMediaSchema),
});

export const UserForumsResponseSchema = z
  .object({
    data: z.array(UserForumItemSchema),
    hasMore: z.boolean(),
  })
  .openapi("UserForumsResponse");

export const getUserForums = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { page, type, topic } = req.query;

    if (!id) {
      return getResponseError(res, new ResponseError("User ID is required", 400));
    }

    const pageNumber = Number(page) || 1;
    const limit = 20;
    const offset = (pageNumber - 1) * limit;
    const cacheKey = `userForums:${id}:type:${type || "all"}:topic:${topic || "all"}:page:${pageNumber}`;
    const cacheData = await redis.get(cacheKey);
    const parse = cacheData ? JSON.parse(cacheData) : null;
    if (parse) {
      const responseBody = UserForumsResponseSchema.parse({
        data: parse,
        hasMore: parse.length === limit,
      });

      return res.status(200).json(responseBody);
    }

    const userForums = await db
      .select({
        id: forums.id,
        userId: forums.userId,
        title: forums.title,
        description: forums.description,
        type: forums.type,
        topic: forums.topic,
        viewCount: forums.viewCount,
        createdAt: forums.createdAt,
        updatedAt: forums.updatedAt,
        mediaUrl: forumMedias.url,
        mediaType: forumMedias.mediaType,
        username: sql`${users.firstName} || ' ' || ${users.lastName}`,
      })
      .from(forums)
      .leftJoin(forumMedias, eq(forums.id, forumMedias.forumId))
      .leftJoin(users, eq(forums.userId, users.id))
      .where(eq(forums.userId, Number(id)))
      .orderBy(desc(forums.createdAt))
      .limit(limit)
      .offset(offset);

    const forumMap = new Map<number, any>();
    for (const forum of userForums) {
      if (!forumMap.has(forum.id)) {
        const formatted = {
          id: forum.id,
          userId: forum.userId,
          title: forum.title,
          description: forum.description,
          type: forum.type,
          topic: forum.topic,
          viewCount: forum.viewCount,
          createdAt: forum.createdAt,
          updatedAt: forum.updatedAt,
          username: forum.username,
          media: [] as { url: string; type: string }[],
        };
        forumMap.set(forum.id, formatted);
      }

      if (forum.mediaUrl) {
        forumMap.get(forum.id).media.push({
          url: forum.mediaUrl,
          type: forum.mediaType,
        });
      }
    }

    const forumsWithMedia = Array.from(forumMap.values());

    await redis.set(cacheKey, JSON.stringify(forumsWithMedia), { EX: 300 });

    const responseBody = UserForumsResponseSchema.parse({
      data: forumsWithMedia,
      hasMore: forumsWithMedia.length === limit,
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};
