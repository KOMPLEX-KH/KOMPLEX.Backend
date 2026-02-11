import { db } from "@/db/index.js";
import { topics, userAITopicHistory } from "@/db/schema.js";
import { asc, eq } from "drizzle-orm";
import { ResponseError } from "@/utils/responseError.js";
export const getAllAiTopicNamesService = async (userId: number) => {
  try {
    const result = await db
      .select({
        id: userAITopicHistory.topicId,
        name: topics.name,
      })
      .from(userAITopicHistory)
      .innerJoin(topics, eq(userAITopicHistory.topicId, topics.id))
      .where(eq(userAITopicHistory.userId, userId))
      .orderBy(asc(userAITopicHistory.updatedAt));
    const uniqueTopicIds = new Set(result.map((r) => r.id));
    return Array.from(uniqueTopicIds).map((id) => ({
      id,
      name: result.find((r) => r.id === id)?.name,
    }));
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};
