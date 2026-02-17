import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, getResponseSuccess } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { userAITopicHistory } from "@/db/drizzle/models/user_ai_topic_history.js";
import { ResponseError } from "@/utils/response.js";
import { eq } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const MeRateAiTopicParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MeRateAiTopicParams");

export const MeRateAiTopicBodySchema = z
  .object({
    rating: z.number(),
    ratingFeedback: z.string().optional(),
  })
  .openapi("MeRateAiTopicBody");

export const MeRateAiTopicResponseSchema = z
  .object({
    data: z.array(z.any()),
  })
  .openapi("MeRateAiTopicResponse");

export const rateAiTopicResponse = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = await MeRateAiTopicParamsSchema.parseAsync(req.params);
    const { rating, ratingFeedback } =
      await MeRateAiTopicBodySchema.parseAsync(req.body);

    const result = await rateAiTopicResponseInternal(
      id,
      Number(rating),
      ratingFeedback ?? ""
    );
    const responseBody = MeRateAiTopicResponseSchema.parse(result);
    return getResponseSuccess(res, responseBody, "AI topic response rated successfully");
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
    return response;
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};

