import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { users, userAIHistory } from "@/db/schema.js";
import { and, eq, asc } from "drizzle-orm";
import { cleanKomplexResponse } from "@/utils/cleanKomplexResponse.js";
import { z } from "@/config/openapi/openapi.js";

export const MeAiGeneralTabHistoryParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MeAiGeneralTabHistoryParams");

export const MeAiGeneralTabHistoryQuerySchema = z
  .object({
    page: z.string().optional(),
    limit: z.string().optional(),
  })
  .openapi("MeAiGeneralTabHistoryQuery");

export const MeAiGeneralTabHistoryItemSchema = z.object({
  prompt: z.string(),
  aiResult: z.string(),
  responseType: z.string(),
});

export const MeAiGeneralTabHistoryResponseSchema = z
  .object({
    data: z.array(MeAiGeneralTabHistoryItemSchema),
  })
  .openapi("MeAiGeneralTabHistoryResponse");

export const getAiGeneralTabHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = await MeAiGeneralTabHistoryParamsSchema.parseAsync(
      req.params
    );
    const { page, limit } = await MeAiGeneralTabHistoryQuerySchema.parseAsync(
      req.query
    );

    const result = await getAiHistoryByTabServiceInternal(
      Number(userId),
      Number(id),
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined
    );

    const responseBody =
      MeAiGeneralTabHistoryResponseSchema.parse(result);
    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};

const getAiHistoryByTabServiceInternal = async (
  userId: number,
  tabId: number,
  page?: number,
  limit?: number
) => {
  try {
    const cacheKey = `aiHistory:${userId}:tabId:${tabId}:page:${page ?? 1}`;
    const cached = await redis.get(cacheKey);
    const parseData = cached ? JSON.parse(cached) : null;
    if (parseData) {
      if (userId !== 0) {
        await db
          .update(users)
          .set({ lastAiTabId: tabId })
          .where(eq(users.id, userId))
          .returning();
      }
      return {
        data: parseData,
      };
    }
    const history = await db
      .select({
        prompt: userAIHistory.prompt,
        aiResult: userAIHistory.aiResult,
        responseType: userAIHistory.responseType,
      })
      .from(userAIHistory)
      .limit(limit ?? 20)
      .offset(((page ?? 1) - 1) * (limit ?? 20))
      .where(
        and(eq(userAIHistory.tabId, tabId), eq(userAIHistory.userId, userId))
      )
      .orderBy(asc(userAIHistory.updatedAt));
    await redis.set(cacheKey, JSON.stringify(history), {
      EX: 60 * 60 * 24,
    });
    const cleanedHistory = history.map((h) => ({
      prompt: h.prompt,
      aiResult: cleanKomplexResponse(
        h.aiResult ?? "",
        h.responseType === "komplex" ? "komplex" : "normal"
      ),
      responseType: h.responseType,
    }));
    if (userId !== 0) {
      await db
        .update(users)
        .set({ lastAiTabId: tabId })
        .where(eq(users.id, userId))
        .returning();
    }
    return {
      data: cleanedHistory,
    };
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};
