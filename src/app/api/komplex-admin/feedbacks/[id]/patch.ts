import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { feedbacks } from "@/db/models/feedbacks.js";
import { redis } from "@/db/redis/redisConfig.js";

export const updateFeedbackStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["resolved", "unresolved", "dismissed"].includes(status)) {
      throw new Error("Invalid status");
    }

    const result = await db
      .update(feedbacks)
      .set({ status })
      .where(eq(feedbacks.id, Number(id)))
      .returning();

    const cacheKey = `feedbacks:${id}`;
    await redis.set(cacheKey, JSON.stringify({ ...result, status }), {
      EX: 600,
    });

    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
