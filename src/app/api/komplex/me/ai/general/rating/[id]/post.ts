import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { userAIHistory } from "@/db/schema.js";
import { ResponseError } from "@/utils/responseError.js";
import { eq } from "drizzle-orm";

export const rateAiGeneralResponse = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { rating, ratingFeedback } = req.body;

    const result = await rateAiResponseInternal(
      id,
      Number(rating),
      ratingFeedback
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error);
  }
};

const rateAiResponseInternal = async (
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

