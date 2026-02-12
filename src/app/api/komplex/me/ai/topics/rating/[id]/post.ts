import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { userAITopicHistory } from "@/db/models/user_ai_topic_history.js";
import { ResponseError } from "@/utils/responseError.js";
import { eq } from "drizzle-orm";

export const rateAiTopicResponse = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { rating, ratingFeedback } = req.body;

    const result = await rateAiTopicResponseInternal(
      id,
      Number(rating),
      ratingFeedback
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error);
  }
};

const rateAiTopicResponseInternal = async (
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

