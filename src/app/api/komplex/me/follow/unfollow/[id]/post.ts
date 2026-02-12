import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { followers } from "@/db/schema.js";
import { and, eq } from "drizzle-orm";
import { getResponseError } from "@/utils/responseError.js";

export const unfollowUser = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const followedId = Number(id);

    await db
      .delete(followers)
      .where(
        and(
          eq(followers.userId, Number(userId)),
          eq(followers.followedId, followedId)
        )
      )
      .returning();

    const myFollowingKeys: string[] = await redis.keys(
      `userFollowing:${userId}:page:*`
    );
    if (myFollowingKeys.length > 0) {
      await redis.del(myFollowingKeys);
    }

    return res.status(200).json({ message: "Successfully unfollowed the user." });
  } catch (error) {
    return getResponseError(res, error);
  }
};
  