import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { userAiTabs } from "@/db/models/user_ai_tabs.js";
import { asc, eq } from "drizzle-orm";

export const getAllAiGeneralTabs = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { page, limit } = req.query;

    const result = await getAllAiTabNamesService(
      Number(userId),
      Number(page),
      Number(limit)
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error);
  }
};

export const getAllAiTabNamesService = async (
  userId: number,
  page?: number,
  limit?: number
) => {
  try {
    const cacheKey = `aiTabs:${userId}:page:${page ?? 1}`;
    const cached = await redis.get(cacheKey);
    const parseData = cached ? JSON.parse(cached) : null;
    if (parseData) {
      return {
        data: parseData,
      };
    }
    const tabs = await db
      .select({ id: userAiTabs.id, name: userAiTabs.tabName })
      .from(userAiTabs)
      .where(eq(userAiTabs.userId, Number(userId)))
      .orderBy(asc(userAiTabs.updatedAt))
      .limit(limit ?? 20)
      .offset(((page ?? 1) - 1) * (limit ?? 20));
    await redis.set(cacheKey, JSON.stringify(tabs), {
      EX: 60 * 60 * 24,
    });
    return {
      data: tabs,
      hasMore: tabs.length === (limit ?? 20),
    };
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};
