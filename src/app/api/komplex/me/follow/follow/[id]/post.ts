import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { followers } from "@/db/drizzle/schema.js";
import { getResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

export const MeFollowUserParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MeFollowUserParams");

export const MeFollowUserResponseSchema = z
  .object({
    message: z.string(),
  })
  .openapi("MeFollowUserResponse");

export const followUser = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { id } = await MeFollowUserParamsSchema.parseAsync(req.params);
    const followedId = Number(id);

    await db
      .insert(followers)
      .values({
        userId: Number(userId),
        followedId: followedId,
      })
      .returning();

    const myFollowingKeys: string[] = await redis.keys(
      `userFollowing:${userId}:page:*`
    );
    if (myFollowingKeys.length > 0) {
      await redis.del(myFollowingKeys);
    }

    const responseBody = MeFollowUserResponseSchema.parse({
      message: "Successfully followed the user.",
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};
