import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { userAITopicHistory } from "@/db/schema.js";
import { and, eq, desc } from "drizzle-orm";

export const getAiTopicHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { page, limit, offset } = req.query;

    const result = await getAiTopicHistoryInternal(
      Number(userId),
      Number(id),
      Number(page),
      Number(limit),
      Number(offset)
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error);
  }
};

const getAiTopicHistoryInternal = async (
  userId: number,
  topicId: number,
  page?: number,
  limit?: number,
  offset?: number
) => {
  try {
    const cacheKey = `aiTopicHistory:${userId}:topicId:${topicId}:page:${page ?? 1
      }`;
    const cached = await redis.get(cacheKey);
    const parseData = cached ? JSON.parse(cached) : null;
    if (parseData) {
      return {
        data: parseData,
        hasMore: parseData.length === (limit ?? 20),
      };
    }
    const history = await db
      .select()
      .from(userAITopicHistory)
      .where(
        and(
          eq(userAITopicHistory.userId, Number(userId)),
          eq(userAITopicHistory.topicId, Number(topicId))
        )
      )
      .orderBy(desc(userAITopicHistory.createdAt))
      .limit(limit ?? 20)
      .offset(((page ?? 1) - 1) * (limit ?? 20));
    const reversedHistory = history.reverse();
    await redis.set(cacheKey, JSON.stringify(reversedHistory), {
      EX: 60 * 60 * 24,
    });
    return {
      data: reversedHistory,
      hasMore: history.length === (limit ?? 20),
    };
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};
