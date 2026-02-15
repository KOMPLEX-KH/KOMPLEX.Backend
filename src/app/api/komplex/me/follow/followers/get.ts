import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { followers } from "@/db/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { getResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

export const MeFollowersQuerySchema = z
  .object({
    page: z.string().optional(),
  })
  .openapi("MeFollowersQuery");

export const MeFollowersResponseSchema = z
  .object({
    data: z.array(z.any()),
    hasMore: z.boolean(),
  })
  .openapi("MeFollowersResponse");

export const getFollowers = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { page } = await MeFollowersQuerySchema.parseAsync(req.query);
    const pageNumber = Number(page) || 1;
    const limit = 20;
    const offset = (pageNumber - 1) * limit;

    const cacheKey = `userFollowers:userId:${userId}:page:${pageNumber}`;
    const redisData = await redis.get(cacheKey);
    if (redisData) {
      const data = JSON.parse(redisData);
      const responseBody = MeFollowersResponseSchema.parse({
        data,
        hasMore: data.length === limit,
      });
      return res.status(200).json(responseBody);
    }

    const followersList = await db
      .select()
      .from(followers)
      .where(eq(followers.followedId, Number(userId)))
      .limit(limit)
      .offset(offset);

    await redis.set(cacheKey, JSON.stringify(followersList), {
      EX: 60 * 60 * 24,
    });

    const responseBody = MeFollowersResponseSchema.parse({
      data: followersList,
      hasMore: followersList.length === limit,
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};