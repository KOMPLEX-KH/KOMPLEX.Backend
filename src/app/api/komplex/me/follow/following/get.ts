import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { followers } from "@/db/schema.js";
import { eq } from "drizzle-orm";
import { getResponseError } from "@/utils/responseError.js";
import { z } from "@/config/openapi/openapi.js";

export const MeFollowingQuerySchema = z
  .object({
    page: z.string().optional(),
  })
  .openapi("MeFollowingQuery");

export const MeFollowingResponseSchema = z
  .object({
    data: z.array(z.any()),
    hasMore: z.boolean(),
  })
  .openapi("MeFollowingResponse");

export const getFollowing = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { page } = await MeFollowingQuerySchema.parseAsync(req.query);
    const pageNumber = Number(page) || 1;
    const limit = 20;
    const offset = (pageNumber - 1) * limit;

    const cacheKey = `userFollowing:userId:${userId}:page:${pageNumber}`;
    const redisData = await redis.get(cacheKey);
    if (redisData) {
      const data = JSON.parse(redisData);
      const responseBody = MeFollowingResponseSchema.parse({
        data,
        hasMore: data.length === limit,
      });
      return res.status(200).json(responseBody);
    }

    const followingList = await db
      .select()
      .from(followers)
      .where(eq(followers.userId, Number(userId)))
      .limit(limit)
      .offset(offset);

    await redis.set(cacheKey, JSON.stringify(followingList), {
      EX: 60 * 60 * 24,
    });

    const responseBody = MeFollowingResponseSchema.parse({
      data: followingList,
      hasMore: followingList.length === limit,
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};