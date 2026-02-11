import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { followers } from "@/db/schema.js";
import { ResponseError } from "@/utils/responseError.js";
import { eq, and } from "drizzle-orm";

export const followUserService = async (userId: number, followedId: number) => {
  try {
    await db
      .insert(followers)
      .values({
        userId: Number(userId),
        followedId: Number(followedId),
      })
      .returning();
    const myFollowingKeys: string[] = await redis.keys(
      `userFollowing:${userId}:page:*`
    );
    if (myFollowingKeys.length > 0) {
      await redis.del(myFollowingKeys);
    }
    return { message: "Successfully followed the user." };
  } catch (error) {
    throw new ResponseError(error as string, 500);  
  }
};
export const unfollowUserService = async (userId: number, followedId: number) => {
  try {
    await db
      .delete(followers)
      .where(
        and(
          eq(followers.userId, Number(userId)),
          eq(followers.followedId, Number(followedId))
        )
      )
      .returning();
  const myFollowingKeys: string[] = await redis.keys(
    `userFollowing:${userId}:page:*`
  );
  if (myFollowingKeys.length > 0) {
    await redis.del(myFollowingKeys);
  }
  return { message: "Successfully unfollowed the user." };
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};
