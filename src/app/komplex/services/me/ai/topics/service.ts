import { db } from "@/db/index.js";
import { topics, userAITopicHistory } from "@/db/schema.js";
import { asc, eq } from "drizzle-orm";

export const getAllAiTopicNamesService = async (userId: number) => {
  try {
    const result = await db
      .select({
        topicId: userAITopicHistory.topicId,
        topicName: topics.name,
      })
      .from(userAITopicHistory)
      .innerJoin(topics, eq(userAITopicHistory.topicId, topics.id))
      .where(eq(userAITopicHistory.userId, userId))
      .orderBy(asc(userAITopicHistory.updatedAt));
    return result;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};
