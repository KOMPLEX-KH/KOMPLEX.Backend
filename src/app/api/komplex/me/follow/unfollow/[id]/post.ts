import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { followers } from "@/db/schema.js";
import { and, eq } from "drizzle-orm";
import { getResponseError } from "@/utils/responseError.js";
import { z } from "@/config/openapi/openapi.js";

export const MeUnfollowUserParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MeUnfollowUserParams");

export const MeUnfollowUserResponseSchema = z
  .object({
    message: z.string(),
  })
  .openapi("MeUnfollowUserResponse");

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

    const responseBody = MeUnfollowUserResponseSchema.parse({
      message: "Successfully unfollowed the user.",
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};
  