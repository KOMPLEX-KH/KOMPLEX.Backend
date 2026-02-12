import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { userAITopicHistory, topics } from "@/db/schema.js";
import { asc, eq } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const MeGetAiTopicsResponseSchema = z
  .object({
    data: z.array(
      z.object({
        id: z.number(),
        name: z.string().nullable().optional(),
      })
    ),
    success: z.literal(true),
    message: z.string(),
  })
  .openapi("MeGetAiTopicsResponse");

export const getAllAiTopics = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const result = await getAllAiTopicNamesServiceInternal(Number(userId));
    const responseBody = MeGetAiTopicsResponseSchema.parse({
      data: result,
      success: true,
      message: "AI topic names fetched successfully",
    });
    return res.status(200).json(responseBody);
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
    const uniqueTopicIds = new Set(result.map((r) => r.id));
    return Array.from(uniqueTopicIds).map((id) => ({
      id,
      name: result.find((r) => r.id === id)?.name,
    }));
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};
