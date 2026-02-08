import { db } from "../../../../db/index.js";
import {
  followers,
  users,
} from "../../../../db/schema.js";
import { count, eq } from "drizzle-orm";
import { redis } from "../../../../db/redis/redisConfig.js";
import { AuthenticatedRequest } from "../../../../types/request.js";
import { Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";

export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response
) => {

  // ! tochange: no db query here
  const userId = req.user?.userId;
  if (!userId) {
    return getResponseError(res, new ResponseError("Missing user ID", 400));
  }
  try {
    const cacheKey = `users:${userId}`;
    const cachedUser = await redis.get(cacheKey);
    if (cachedUser) {
      return res.status(200).json(JSON.parse(cachedUser));
    }
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]) {
      return getResponseError(res, new ResponseError("User not found", 404));
    }
    await redis.set(cacheKey, JSON.stringify(user[0]), { EX: 60 * 60 * 24 });
    return res.status(200).json(user[0]);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const getMeProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.user?.userId;
  if (!userId) {
      return getResponseError(res, new ResponseError("Missing user ID", 400));
  }
  try {
    const cacheKey = `user:${userId}:profile`;

    const cachedProfile = await redis.get(cacheKey);
    if (cachedProfile) {
      return res.status(200).json({
        data: JSON.parse(cachedProfile),
        success: true,
        message: "User profile fetched successfully",
      });
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

    await redis.set(
      cacheKey,
      JSON.stringify({
        ...userProfile[0],
        numberOfFollowers: numberOfFollowers[0].count,
        numberOfFollowing: numberOfFollowing[0].count,
      }),
      { EX: 300 }
    );
    return res.status(200).json({
      data: {
        ...userProfile[0],
        numberOfFollowers: numberOfFollowers[0].count,
        numberOfFollowing: numberOfFollowing[0].count,
      },
      success: true,
      message: "User profile fetched successfully",
    });
  } catch (error) {
    return getResponseError(res, error );
  }
};
