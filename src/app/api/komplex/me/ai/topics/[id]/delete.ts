import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { userAITopicHistory } from "@/db/models/user_ai_topic_history.js";
import { redis } from "@/db/redis/redisConfig.js";
import { and, eq } from "drizzle-orm";

export const deleteAiTopic = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const result = await deleteAiTopicTabInternal(
      Number(userId),
      Number(id)
    );
    return res.status(200).json({
      success: true,
      message: "AI topic tab deleted successfully",
      data: result,
    });
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

