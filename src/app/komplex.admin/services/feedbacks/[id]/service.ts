import { feedbackStatusEnum } from "./../../../../../db/models/feedback_status.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { feedbacks } from "@/db/models/feedbacks.js";
import { redis } from "@/db/redis/redisConfig.js";

export const updateFeedbackStatus = async (
  id: number,
  status: "resolved" | "unresolved" | "dismissed"
) => {
  try {
    const result = await db
      .update(feedbacks)
      .set({ status })
      .where(eq(feedbacks.id, id))
      .returning();

    const cacheKey = `feedbacks:${id}`;
    await redis.set(cacheKey, JSON.stringify({ ...result, status }), {
      EX: 600,
    });

    return result;
  } catch (error) {
    throw new Error(
      `Failed to update feedback status: ${(error as Error).message}`
    );
  }
};
