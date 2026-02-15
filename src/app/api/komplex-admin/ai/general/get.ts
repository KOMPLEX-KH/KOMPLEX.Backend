import { Request, Response } from "express";
import { getResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { userAIHistory } from "@/db/drizzle/schema.js";
import { z } from "@/config/openapi/openapi.js";
export const GeneralAiResponsesResponseSchema = z.object({
  id: z.number(),
  userId: z.number(),
  prompt: z.string(),
  response: z.string(),
  rating: z.number().nullable(),
  ratingFeedback: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
}).openapi("GeneralAiResponsesResponse");

export const getGeneralAiResponses = async (req: Request, res: Response) => {
  try {
    const result = await db.select().from(userAIHistory);
    return res.status(200).json({ data: GeneralAiResponsesResponseSchema.parse(result) });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

