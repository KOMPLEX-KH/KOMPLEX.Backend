import { db } from "@/db/index.js";
import { userAITopicHistory } from "@/db/schema.js";

export const getTopicAiResponses = async () => {
  try {
    const result = await db.select().from(userAITopicHistory);
    return result;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};
