import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import {
  forumLikes,
  followers,
  forums,
  users,
  userSavedVideos,
  videos,
  videoLikes,
} from "@/db/drizzle/schema.js";
import { count, eq } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const UserProfileResponseSchema = z
  .object({
    data: z.any(),
  })
  .openapi("UserProfileResponse");

export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    if (!id) {
      return getResponseError(res, new ResponseError("User ID is required", 400));
    }

    const cacheKey = `user:${id}:profile`;

    const cachedProfile = await redis.get(cacheKey);
    if (cachedProfile) {
      return res.status(200).json({ data: JSON.parse(cachedProfile) });
    }

    const userProfile = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(id)));

    const numberOfFollowers = await db
      .select({ count: count() })
      .from(followers)
      .where(eq(followers.followedId, Number(id)));

    const numberOfFollowing = await db
      .select({ count: count() })
      .from(followers)
      .where(eq(followers.userId, Number(id)));

    const profileData = {
      ...userProfile[0],
      numberOfFollowers: numberOfFollowers[0].count,
      numberOfFollowing: numberOfFollowing[0].count,
    };

    await redis.set(cacheKey, JSON.stringify(profileData), { EX: 300 });

    const responseBody = UserProfileResponseSchema.parse({
      data: profileData,
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};
