import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, getResponseSuccess, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { userAITopicHistory, topics } from "@/db/drizzle/schema.js";
import { asc, eq } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const MeAiTopicItemSchema = z
  .object({
    id: z.number(),
    name: z.string().nullable().optional(),
  })
  .openapi("MeAiTopicItemSchema");

export const getAllAiTopics = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const result = await getAllAiTopicNamesServiceInternal(Number(userId));
    const responseBody = MeAiTopicItemSchema.array().parse(result);
    return getResponseSuccess(res, responseBody, "AI topic names fetched successfully");
  } catch (error) {
    return getResponseError(res, error);
  }
};

const getAllAiTopicNamesServiceInternal = async (userId: number) => {
  try {
    const result = await db
      .select({
        id: userAITopicHistory.topicId,
        name: topics.name,
      })
      .from(userAITopicHistory)
      .innerJoin(topics, eq(userAITopicHistory.topicId, topics.id))
      .where(eq(userAITopicHistory.userId, userId))
      .orderBy(asc(userAITopicHistory.updatedAt));
    return result;
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};
