import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { topics } from "@/db/models/topics.js";
import { redis } from "@/db/redis/redisConfig.js";
import { users } from "@/db/models/users.js";
import { ResponseError } from "@/utils/responseError.js";

export const getTopic = async (topicId: string, userId: number) => {
  const cached = await redis.get(`topic:${topicId}`);
  if (cached) {
    if (userId !== 0) {
      const [updatedUser] = await db
        .update(users)
        .set({ lastTopicId: Number(topicId) })
        .where(eq(users.id, userId))
        .returning();
      if (!updatedUser) {
        throw new ResponseError("Failed to update user last topic", 500);
      }
    }
    return { data: JSON.parse(cached) };
  }
  try {
    const [topic] = await db
      .select()
      .from(topics)
      .where(eq(topics.id, Number(topicId)));

    if (!topic) {
      throw new ResponseError("Topic not found", 404);
    }

    if (userId !== 0) {
      const [updatedUser] = await db
        .update(users)
        .set({ lastTopicId: Number(topicId) })
        .where(eq(users.id, userId))
        .returning();
      if (!updatedUser) {
        throw new ResponseError("Failed to update user last topic", 500);
      }
    }

    await redis.set(
      `topic:${topicId}`,
      JSON.stringify({
        component: topic.component,
        componentCode: topic.componentCode,
      }),
      {
        EX: 60 * 60 * 24,
      }
    );

    return {
      data: { component: topic.component, componentCode: topic.componentCode },
    };
  } catch (error) {
    throw new ResponseError(`Error fetching topic: ${(error as Error).message}`, 500);
  }
};
