import { db } from "../../../../db/index.js";
import {
  forumLikes,
  followers,
  users,
  userSavedVideos,
  videos,
  videoLikes,
} from "../../../../db/schema.js";
import { forums } from "../../../../db/schema.js";
import { count, eq } from "drizzle-orm";
import { redis } from "../../../../db/redis/redisConfig.js";
import { AuthenticatedRequest } from "../../../../types/request.js";
import { Response } from "express";

export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Missing user ID" });
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
    console.log("user", user);
    if (!user[0]) {
      return res.status(401).json({ message: "User not found" });
    }
    await redis.set(cacheKey, JSON.stringify(user[0]), { EX: 60 * 60 * 24 });
    return res.status(200).json(user[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMeProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Missing user ID",
    });
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
    return res.status(500).json({
      success: false,
      message: "Failed to get user profile",
      error: (error as Error).message,
    });
  }
};
