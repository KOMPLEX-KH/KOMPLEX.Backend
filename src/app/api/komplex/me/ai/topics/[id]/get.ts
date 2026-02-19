import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, getResponseSuccess, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { userAITopicHistory } from "@/db/drizzle/schema.js";
import { and, eq, desc } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const MeAiTopicHistoryParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MeAiTopicHistoryParams");

export const MeAiTopicHistoryQuerySchema = z
  .object({
    page: z.string().optional(),
    limit: z.string().optional(),
  })
  .openapi("MeAiTopicHistoryQuery");

export const MeAiTopicHistoryItemSchema = z.object({
  id: z.number(),
  userId: z.number(),
  topicId: z.number(),
  prompt: z.string(),
  response: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
}).openapi("MeAiTopicHistoryItem");

export const getAiTopicHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = await MeAiTopicHistoryParamsSchema.parseAsync(req.params);
    const { page, limit } =
      await MeAiTopicHistoryQuerySchema.parseAsync(req.query);

    const result = await getAiTopicHistoryInternal(
      Number(userId),
      Number(id),
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
    const responseBody = MeAiTopicHistoryItemSchema.array().parse(result);
    return getResponseSuccess(res, responseBody, "AI topic history fetched successfully");
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
      return parseData;
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
    return reversedHistory;
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};
