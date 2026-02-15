import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { videos, users } from "@/db/drizzle/schema.js";
import { desc, eq } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

const UserVideoItemSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  type: z.string(),
  topic: z.string().nullable().optional(),
  duration: z.number().nullable().optional(),
  videoUrl: z.string(),
  thumbnailUrl: z.string().nullable().optional(),
  viewCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userFirstName: z.string(),
  userLastName: z.string(),
});

export const UserVideosResponseSchema = z
  .object({
    data: z.array(UserVideoItemSchema),
    hasMore: z.boolean(),
  })
  .openapi("UserVideosResponse");

export const getUserVideos = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { page, topic, type } = req.query;

    if (!id) {
      return getResponseError(res, new ResponseError("User ID is required", 400));
    }

    const cacheKey = `userVideos:${id}:type:${type || "all"}:topic:${topic || "all"}:page:${page || 1}`;
    const limit = 20;
    const pageNumber = Number(page) || 1;
    const offset = (pageNumber - 1) * limit;

    const cachedVideos = await redis.get(cacheKey);
    const parsedData = cachedVideos ? JSON.parse(cachedVideos) : null;
    if (parsedData) {
      const responseBody = UserVideosResponseSchema.parse({
        data: parsedData,
        hasMore: parsedData.length === limit,
      });

      return res.status(200).json(responseBody);
    }

    const userVideos = await db
      .select({
        id: videos.id,
        userId: videos.userId,
        title: videos.title,
        description: videos.description,
        type: videos.type,
        topic: videos.topic,
        duration: videos.duration,
        videoUrl: videos.videoUrl,
        thumbnailUrl: videos.thumbnailUrl,
        viewCount: videos.viewCount,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(videos)
      .leftJoin(users, eq(videos.userId, users.id))
      .where(eq(videos.userId, Number(id)))
      .orderBy(desc(videos.createdAt))
      .limit(limit)
      .offset(offset);

    await redis.set(cacheKey, JSON.stringify(userVideos), {
      EX: 300,
    });

    const responseBody = UserVideosResponseSchema.parse({
      data: userVideos,
      hasMore: userVideos.length === limit,
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};
