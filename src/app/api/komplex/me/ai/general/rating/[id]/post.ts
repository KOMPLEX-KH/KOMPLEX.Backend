import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { userAIHistory } from "@/db/schema.js";
import { ResponseError } from "@/utils/responseError.js";
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
    return res.status(200).json(responseBody);
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

