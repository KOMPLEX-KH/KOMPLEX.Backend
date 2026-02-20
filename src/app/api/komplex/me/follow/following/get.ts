import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { followers } from "@/db/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { getResponseError, getResponseSuccess } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

export const MeFollowingQuerySchema = z
  .object({
    page: z.string().optional(),
  })
  .openapi("MeFollowingQuery");

export const MeFollowingItemSchema = z.object({
  id: z.number(),
  userId: z.number(),
  followedId: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}).openapi("MeFollowingItemSchema");

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
      const responseBody = MeFollowingItemSchema.array().parse(data);
      return getResponseSuccess(res, responseBody, "Following fetched successfully", data.length === limit);
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

    const responseBody = MeFollowingItemSchema.array().parse(followingList);
    return getResponseSuccess(res, responseBody, "Following fetched successfully", followingList.length === limit);
  } catch (error) {
    return getResponseError(res, error);
  }
};