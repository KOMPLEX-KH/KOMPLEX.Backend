import { db } from "@/db/index.js";
import { userAIHistory } from "@/db/schema.js";
import { ResponseError } from "@/utils/responseError.js";
import { eq } from "drizzle-orm";

export const rateAiResponse = async (
  id: string,
  rating: number,
  ratingFeedback: string
) => {
  try {
    const response = await db
      .update(userAIHistory)
      .set({ rating, ratingFeedback })
      .where(eq(userAIHistory.id, Number(id)))
      .returning();
    return { data: response };
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};
