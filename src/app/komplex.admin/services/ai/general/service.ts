import { db } from "@/db/index.js";
import { userAIHistory } from "@/db/schema.js";

export const getGeneralAiResponses = async () => {
  try {
    const result = await db.select().from(userAIHistory);
    return result;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};
