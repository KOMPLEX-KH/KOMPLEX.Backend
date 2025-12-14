import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { topics } from "@/db/models/topics.js";
import { redis } from "@/db/redis/redisConfig.js";
import { users } from "@/db/models/users.js";

export const getTopic = async (topicId: string, userId: number) => {
  const cached = await redis.get(`topic:${topicId}`);
  if (cached) {
    return { data: JSON.parse(cached) };
  }
  try {
    const [topic] = await db
      .select()
      .from(topics)
      .where(eq(topics.id, Number(topicId)));

    if (!topic) {
      throw new Error("Topic not found");
    }

    if (userId !== 0) {
      const [updatedUser] = await db
        .update(users)
        .set({ lastTopicId: Number(topicId) })
        .where(eq(users.id, userId))
        .returning();
      if (!updatedUser) {
        throw new Error("Failed to update user last topic");
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
    throw new Error(`Error fetching topic: ${(error as Error).message}`);
  }
};
