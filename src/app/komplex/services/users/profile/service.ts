import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import {
  forumLikes,
  followers,
  forums,
  users,
  userSavedVideos,
  videos,
  videoLikes,
} from "@/db/schema.js";
import { count, eq } from "drizzle-orm";

export const getUserProfile = async (userId: number) => {
  try {
    const cacheKey = `user:${userId}:profile`;

    const cachedProfile = await redis.get(cacheKey);
    if (cachedProfile) {
      return { data: JSON.parse(cachedProfile) };
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
    return {
      data: {
        ...userProfile[0],
        numberOfFollowers: numberOfFollowers[0].count,
        numberOfFollowing: numberOfFollowing[0].count,
      },
    };
  } catch (error) {
    throw new Error("Failed to get user profile");
  }
};
