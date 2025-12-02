import { db } from "@/db/index.js";
import { userAiTabs } from "@/db/models/user_ai_tabs.js";
import { redis } from "@/db/redis/redisConfig.js";
import { asc, eq } from "drizzle-orm";

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
    throw new Error((error as Error).message);
  }
};
