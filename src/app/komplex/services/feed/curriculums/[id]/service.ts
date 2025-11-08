import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { topics } from "@/db/models/topics.js";
import { redis } from "@/db/redis/redisConfig.js";

export const getTopic = async (topicId: string) => {
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
