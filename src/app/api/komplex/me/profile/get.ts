import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";
import { getResponseError, getResponseSuccess, ResponseError } from "@/utils/response.js";
import { redis } from "@/db/redis/redis.js";
import { db } from "@/db/drizzle/index.js";
import { followers, users } from "@/db/drizzle/schema.js";
import { count, eq } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const MeProfileResponseSchema = z
  .object({
    id: z.number(),
    uid: z.string(),
    username: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    dateOfBirth: z.string().nullable().optional(),
    isAdmin: z.boolean(),
    isVerified: z.boolean(),
    isSocial: z.boolean(),
    email: z.string().email(),
    phone: z.string().nullable().optional(),
    profileImage: z.string().nullable().optional(),
    profileImageKey: z.string().nullable().optional(),
    lastTopicId: z.number().nullable().optional(),
    lastVideoId: z.number().nullable().optional(),
    lastAiTabId: z.number().nullable().optional(),
    numberOfFollowers: z.number(),
    numberOfFollowing: z.number(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .openapi("MeProfileResponse");

export const getMeProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.user?.userId;
  if (!userId) {
    return getResponseError(res, new ResponseError("Missing user ID", 400));
  }
  try {
    const cacheKey = `users:${userId}`;

    const cachedProfile = await redis.get(cacheKey);
    if (cachedProfile) {
      const responseBody = MeProfileResponseSchema.parse(JSON.parse(cachedProfile));
      return getResponseSuccess(res, responseBody, "User profile fetched successfully");
    }
    const userProfile = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    const numberOfFollowers = await db
      .select({ count: count() })
      .from(followers)
      .where(eq(followers.followedId, userId));

    const numberOfFollowing = await db
      .select({ count: count() })
      .from(followers)
      .where(eq(followers.userId, userId));

    const profileData = {
      ...userProfile[0],
      numberOfFollowers: numberOfFollowers[0].count,
      numberOfFollowing: numberOfFollowing[0].count,
    };

    await redis.set(cacheKey, JSON.stringify(profileData), { EX: 300 });

    const responseBody = MeProfileResponseSchema.parse(profileData);
    return getResponseSuccess(res, responseBody, "User profile fetched successfully");
  } catch (error) {
    return getResponseError(res, error);
  }
};
