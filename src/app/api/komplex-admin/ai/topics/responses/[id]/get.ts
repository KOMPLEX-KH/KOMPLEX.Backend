import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { userAITopicHistory } from "@/db/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const TopicAiResponseByIdResponseSchema = z.object({
  id: z.number(),
  userId: z.number(),
  prompt: z.string(),
  response: z.string(),
  rating: z.number().nullable(),
  ratingFeedback: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
}).openapi("TopicAiResponseByIdResponse");

export const getTopicAiResponseById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      throw new ResponseError("Invalid ID parameter", 400);
    }

    const result = await db
      .select()
      .from(userAITopicHistory)
      .where(eq(userAITopicHistory.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new ResponseError("AI topic response not found", 404);
    }

    return res.status(200).json({ data: TopicAiResponseByIdResponseSchema.parse(result[0]) });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

