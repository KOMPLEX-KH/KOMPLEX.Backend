import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { topics } from "@/db/models/topics.js";

export const getTopic = async (topicId: string) => {
  try {
    const [topic] = await db
      .select()
      .from(topics)
      .where(eq(topics.id, Number(topicId)));

    if (!topic) {
      throw new Error("Topic not found");
    }

    return {
      data: { component: topic.component, componentCode: topic.componentCode },
    };
  } catch (error) {
    throw new Error(`Error fetching topic: ${(error as Error).message}`);
  }
};
