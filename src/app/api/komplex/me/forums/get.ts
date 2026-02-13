import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { eq, sql, and } from "drizzle-orm";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { forums, forumMedias, users, forumLikes } from "@/db/schema.js";
import { getResponseError } from "@/utils/responseError.js";
import { z } from "@/config/openapi/openapi.js";

export const MeGetForumsQuerySchema = z
  .object({
    type: z.string().optional(),
    topic: z.string().optional(),
    page: z.string().optional(),
  })
  .openapi("MeGetForumsQuery");

export const MeForumItemSchema = z
  .object({
    id: z.number(),
    userId: z.number(),
    title: z.string(),
    description: z.string(),
    type: z.string().nullable().optional(),
    topic: z.string().nullable().optional(),
    viewCount: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
    likeCount: z.number(),
    media: z
      .array(
        z.object({
          url: z.string(),
          type: z.string(),
        })
      )
      .default([]),
    username: z.string(),
    profileImage: z.string().nullable().optional(),
  })
  .openapi("MeForumItem");

export const MeGetForumsResponseSchema = z
  .object({
    data: z.array(MeForumItemSchema),
    hasMore: z.boolean(),
  })
  .openapi("MeGetForumsResponse");

export const getAllForums = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { type, topic, page } = await MeGetForumsQuerySchema.parseAsync(
      req.query
    );

    const conditions = [];
    conditions.push(eq(forums.userId, userId));
    if (type) conditions.push(eq(forums.type, type as string));
    if (topic) conditions.push(eq(forums.topic, topic as string));

    const pageNumber = Number(page) || 1;
    const limit = 20;
    const offset = (pageNumber - 1) * limit;

    const cacheKey = `userForums:${userId}:type:${type || "all"}:topic:${
      topic || "all"
    }:page:${pageNumber}`;
    const cached = await redis.get(cacheKey);
    const parseData = cached ? JSON.parse(cached) : null;
    if (parseData) {
      let dataToSend = [] as any[];
      await Promise.all(
        parseData.data.map(async (forum: any) => {
          const [freshForumData] = await db
            .select({
              likeCount: sql`COUNT(DISTINCT ${forumLikes.id})`,
              viewCount: forums.viewCount,
            })
            .from(forums)
            .where(eq(forums.id, forum.id))
            .leftJoin(forumLikes, eq(forumLikes.forumId, forums.id))
            .groupBy(forums.id);
          dataToSend.push({
            ...forum,
            likeCount: Number(freshForumData.likeCount),
            viewCount: freshForumData.viewCount,
          });
        })
      );

      const responseBody = MeGetForumsResponseSchema.parse({
        data: [...dataToSend],
        hasMore: parseData.length === limit,
      });

      return res.status(200).json(responseBody);
    }

    const forumRecords = await db
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
        likeCount: sql`COUNT(DISTINCT ${forumLikes.id})`,
        username: sql`${users.firstName} || ' ' || ${users.lastName}`,
        profileImage: users.profileImage,
      })
      .from(forums)
      .leftJoin(forumMedias, eq(forums.id, forumMedias.forumId))
      .leftJoin(users, eq(forums.userId, users.id))
      .leftJoin(
        forumLikes,
        and(
          eq(forumLikes.forumId, forums.id),
          eq(forumLikes.userId, Number(userId))
        )
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(
        forums.id,
        forums.userId,
        forums.title,
        forums.description,
        forums.type,
        forums.topic,
        forums.viewCount,
        forums.createdAt,
        forums.updatedAt,
        forumMedias.url,
        forumMedias.mediaType,
        users.firstName,
        users.lastName,
        forumLikes.forumId,
        users.profileImage
      )
      .offset(offset)
      .limit(limit);

    const forumsWithMedia = Object.values(
      forumRecords.reduce((acc, forum) => {
        if (!acc[forum.id]) {
          acc[forum.id] = {
            id: forum.id,
            userId: forum.userId,
            title: forum.title,
            description: forum.description,
            type: forum.type,
            topic: forum.topic,
            viewCount: forum.viewCount,
            createdAt: forum.createdAt,
            updatedAt: forum.updatedAt,
            likeCount: Number(forum.likeCount) || 0,
            media: [] as { url: string; type: string }[],
            username: forum.username,
            profileImage: forum.profileImage,
          };
        }
        if (forum.mediaUrl) {
          acc[forum.id].media.push({
            url: forum.mediaUrl,
            type: forum.mediaType,
          });
        }
        return acc;
      }, {} as { [key: number]: any })
    ) as Record<number, any>[];

    await redis.set(
      cacheKey,
      JSON.stringify({
        data: forumsWithMedia,
        hasMore: forumsWithMedia.length === limit,
      }),
      {
        EX: 60 * 60 * 24,
      }
    );

    const responseBody = MeGetForumsResponseSchema.parse({
      data: forumsWithMedia,
      hasMore: forumsWithMedia.length === limit,
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};
