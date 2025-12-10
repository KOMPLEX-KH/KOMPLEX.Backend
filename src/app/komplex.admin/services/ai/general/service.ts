import { db } from "@/db/index.js";
import { userAIHistory } from "@/db/schema.js";
import { eq } from "drizzle-orm";

export const getGeneralAiResponses = async () => {
  try {
    const result = await db.select().from(userAIHistory);
    return { data: result };
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export const getGeneralAiResponseById = async (id: number) => {
  try {
    const result = await db
      .select()
      .from(userAIHistory)
      .where(eq(userAIHistory.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new Error("AI response not found");
    }

    return {data: result[0]};
  } catch (error) {
    throw new Error((error as Error).message);
  }
};
