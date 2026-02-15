import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { userAITopicHistory } from "@/db/drizzle/models/user_ai_topic_history.js";
import { redis } from "@/db/redis/redis.js";
import { and, eq } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const MeDeleteAiTopicParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MeDeleteAiTopicParams");

export const MeDeleteAiTopicResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      data: z.array(z.any()),
    }),
  })
  .openapi("MeDeleteAiTopicResponse");

export const deleteAiTopic = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = await MeDeleteAiTopicParamsSchema.parseAsync(req.params);
    const { userId } = req.user;

    const result = await deleteAiTopicTabInternal(
      Number(userId),
      Number(id)
    );
    const responseBody = MeDeleteAiTopicResponseSchema.parse({
      success: true,
      message: "AI topic tab deleted successfully",
      data: result,
    });
    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};

const deleteAiTopicTabInternal = async (userId: number, topicId: number) => {
  try {
    const response = await db
      .delete(userAITopicHistory)
      .where(
        and(
          eq(userAITopicHistory.userId, userId),
          eq(userAITopicHistory.topicId, topicId)
        )
      )
      .returning();
    await redis.flushAll(); // TO CHANGE
    return { data: response };
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};

