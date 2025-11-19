import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { userAIHistory } from "@/db/schema.js";
import { eq, desc, asc } from "drizzle-orm";
import axios from "axios";
import { cleanKomplexResponse } from "../../../../../utils/cleanKomplexResponse.js";

export const callAiAndWriteToHistory = async (
  prompt: string,
  responseType: string,
  userId: number
) => {
  try {
    const cacheKey = `previousContext:${userId}`;
    const cacheRaw = await redis.get(cacheKey);
    const cacheData = cacheRaw ? JSON.parse(cacheRaw) : null;
    let previousContext = null;
    if (Array.isArray(cacheData) && cacheData.length >= 5) {
      previousContext = cacheData;
    } else {
      previousContext = await db
        .select({
          prompt: userAIHistory.prompt,
          aiResult: userAIHistory.aiResult,
        })
        .from(userAIHistory)
        .where(eq(userAIHistory.userId, Number(userId)))
        .orderBy(desc(userAIHistory.createdAt))
        .limit(3)
        .then((res) => res.map((r) => r.prompt).join("\n"));
    }
    console.log("requesting to dara", `${process.env.DARA_ENDPOINT}/gemini`);
    const response = await axios.post(
      `${process.env.DARA_ENDPOINT}/gemini`,
      {
        prompt,
        responseType,
        previousContext,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.INTERNAL_API_KEY,
        },
      }
    );
    const result = response.data;
    const aiResult = cleanKomplexResponse(result.result ?? "", responseType);
    let newHistory;
    if (aiResult) {
      newHistory = await db
        .insert(userAIHistory)
        .values({
          userId: Number(userId),
          prompt: prompt,
          aiResult: aiResult,
          responseType: responseType as "normal" | "komplex",
        })
        .returning();
      const newCacheData = await db
        .select({
          prompt: userAIHistory.prompt,
          aiResult: userAIHistory.aiResult,
          responseType: userAIHistory.responseType,
        })
        .from(userAIHistory)
        .where(eq(userAIHistory.userId, Number(userId)))
        .orderBy(desc(userAIHistory.createdAt))
        .limit(4)
        .then((res) => res.map((r) => r.prompt).join("\n"));
      await redis.set(
        cacheKey,
        JSON.stringify([...newCacheData, ...newHistory]),
        { EX: 60 * 60 * 24 }
      );
    }
    return {
      prompt,
      responseType,
      data: {
        aiResult,
        id: newHistory?.[0]?.id,
      },
    };
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export const getAiHistory = async (
  userId: number,
  page?: number,
  limit?: number,
  offset?: number
) => {
  try {
    const cacheKey = `aiHistory:${userId}:page:${page ?? 1}`;
    await redis.del(cacheKey);
    const cached = await redis.get(cacheKey);
    const parseData = cached ? JSON.parse(cached) : null;
    if (parseData) {
      return {
        data: parseData.slice((limit ?? 20) - parseData.length),
        hasMore: parseData.length === (limit ?? 20),
      };
    }
    const history = await db
      .select()
      .from(userAIHistory)
      .where(eq(userAIHistory.userId, Number(userId)))
      .orderBy(desc(userAIHistory.createdAt))
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
    throw new Error((error as Error).message);
  }
};
