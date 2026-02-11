import { db } from "@/db/index.js";
import { userAITopicHistory } from "@/db/schema.js";
import { eq } from "drizzle-orm";

export const getTopicAiResponses = async () => {
  try {
    const result = await db.select().from(userAITopicHistory);
    return { data: result };
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export const getTopicAiResponseById = async (id: number) => {
  try {
    const result = await db
      .select()
      .from(userAITopicHistory)
      .where(eq(userAITopicHistory.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new Error("AI topic response not found");
    }

    return { data: result[0] };
  } catch (error) {
    throw new Error((error as Error).message);
  }
};
