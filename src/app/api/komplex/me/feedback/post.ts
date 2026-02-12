import { db } from "@/db/index.js";
import { feedbacks } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";
import { ResponseError, getResponseError } from "@/utils/responseError.js";
import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";

export const postFeedback = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { content, type } = req.body;
    const userID = Number(userId) === 0 ? null : Number(userId);
    const feedback = await db
      .insert(feedbacks)
      .values({
        content,
        type,
        userId: userID,
        status: "unresolved",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    const cacheKey = `feedback:${feedback[0].id}`;
    await redis.set(cacheKey, JSON.stringify(feedback[0]), { EX: 600 });
    return res.status(201).json(feedback);
  } catch (error) {
    return getResponseError(res, error);
  }
};
