import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { followers } from "@/db/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { getResponseError, getResponseSuccess } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

export const MeUnfollowUserParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MeUnfollowUserParams");

export const unfollowUser = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { id } = await MeUnfollowUserParamsSchema.parseAsync(req.params);
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

    return getResponseSuccess(res, null, "Successfully unfollowed the user.");
  } catch (error) {
    return getResponseError(res, error);
  }
};
