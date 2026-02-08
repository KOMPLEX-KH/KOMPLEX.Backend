import { db } from "@/db/index.js";
import { userAITopicHistory } from "@/db/models/user_ai_topic_history.js";
import { ResponseError } from "@/utils/responseError.js";
import { eq } from "drizzle-orm";

export const rateAiTopicResponse = async (
  id: string,
  rating: number,
  ratingFeedback: string
) => {
  try {
    const response = await db
      .update(userAITopicHistory)
      .set({ rating, ratingFeedback })
      .where(eq(userAITopicHistory.id, Number(id)))
      .returning();
    return { data: response };
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};
