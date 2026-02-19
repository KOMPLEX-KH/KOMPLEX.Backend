import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, getResponseSuccess } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { userAIHistory } from "@/db/drizzle/schema.js";
import { ResponseError } from "@/utils/response.js";
import { eq } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const MeRateAiGeneralParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MeRateAiGeneralParams");

export const MeRateAiGeneralBodySchema = z
  .object({
    rating: z.number(),
    ratingFeedback: z.string().optional(),
  })
  .openapi("MeRateAiGeneralBody");

export const MeRateAiGeneralResponseSchema = z
  .object({
    data: z.array(z.any()),
  })
  .openapi("MeRateAiGeneralResponse");

export const rateAiGeneralResponse = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = await MeRateAiGeneralParamsSchema.parseAsync(req.params);
    const { rating, ratingFeedback } =
      await MeRateAiGeneralBodySchema.parseAsync(req.body);

    const result = await rateAiResponseInternal(
      id,
      Number(rating),
      ratingFeedback ?? ""
    );
    const responseBody = MeRateAiGeneralResponseSchema.parse(result);
    return getResponseSuccess(res, responseBody, "AI general response rated successfully");
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
    return response;
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};

