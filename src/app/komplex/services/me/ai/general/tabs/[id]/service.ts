import { cleanKomplexResponse } from "@/utils/cleanKomplexResponse.js";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { userAIHistory } from "@/db/models/user_ai_history.js";
import { eq, desc, and } from "drizzle-orm";
import axios from "axios";
import { userAiTabs } from "@/db/models/user_ai_tabs.js";

export const callAiGeneralService = async (
  prompt: string,
  responseType: string,
  userId: number,
  tabId: number
) => {
  try {
    const cacheKey = `previousContext:${userId}:tabId:${tabId}`;
    const cacheRaw = await redis.get(cacheKey);
    const cacheData = cacheRaw ? JSON.parse(cacheRaw) : null;
    let previousContext = null;
    if (Array.isArray(cacheData) && cacheData.length >= 5) {
      previousContext = cacheData;
    } else {
      previousContext = await db
        .select({
          tabSummary: userAiTabs.tabSummary,
        })
        .from(userAiTabs)
        .where(
          and(eq(userAiTabs.userId, Number(userId)), eq(userAiTabs.id, tabId))
        );
      previousContext = previousContext[0].tabSummary;
      await redis.set(cacheKey, JSON.stringify(previousContext), {
        EX: 60 * 60 * 24,
      });
    }
    const response = await axios.post(
      `${process.env.FAST_API_KEY}`,
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
    const aiResult = result.result;
    if (aiResult) {
      await db.insert(userAIHistory).values({
        userId: Number(userId),
        prompt: prompt,
        aiResult: aiResult,
        tabId: tabId,
      });
      const summarizeCounterCacheKey = `summarizeCounter:${userId}:tabId:${tabId}`;
      const currentCountRaw = await redis.get(summarizeCounterCacheKey);
      const currentCount = currentCountRaw ? parseInt(currentCountRaw, 10) : 0;
      if (currentCount >= 5) {
        const summaryText = await summarize(aiResult, "summary");
        await db
          .update(userAiTabs)
          .set({
            tabSummary: summaryText.summary || aiResult,
          })
          .where(eq(userAiTabs.id, tabId));
        await redis.set(summarizeCounterCacheKey, "0", {
          EX: 60 * 60 * 24 * 3,
        });
      } else {
        await redis.set(
          summarizeCounterCacheKey,
          (currentCount + 1).toString(),
          { EX: 60 * 60 * 24 * 3 }
        );
      }
    }
    return { prompt, data: aiResult };
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export const callAiFirstTimeService = async (
  prompt: string,
  responseType: string,
  userId: number
) => {
  try {
    const tabIdAndTabName = await createNewTab(userId, prompt);
    const response = await axios.post(
      `${process.env.AI_URL_LOCAL}/gemini`,
      {
        prompt,
        responseType,
        previousContext: "",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.INTERNAL_API_KEY,
        },
      }
    );
    const result = response.data;
    const aiResult = result.result;
    if (aiResult) {
      await db.insert(userAIHistory).values({
        userId: Number(userId),
        prompt: prompt,
        aiResult: aiResult,
        tabId: tabIdAndTabName.tabId,
      });
      await db
        .update(userAiTabs)
        .set({
          tabSummary: tabIdAndTabName.tabName,
        })
        .where(eq(userAiTabs.id, tabIdAndTabName.tabId));
      const cacheKey = `previousContext:${userId}:tabId:${tabIdAndTabName.tabId}`;
      await redis.set(cacheKey, JSON.stringify(aiResult), { EX: 60 * 60 * 24 });
      const summarizeCounterCacheKey = `summarizeCounter:${userId}:tabId:${tabIdAndTabName.tabId}`;
      await redis.set(summarizeCounterCacheKey, "0", { EX: 60 * 60 * 24 * 3 });
    }
    return {
      prompt,
      data: aiResult,
      id: tabIdAndTabName.tabId,
      name: tabIdAndTabName.tabName,
    };
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export const getAiHistoryByTabService = async (
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
      .orderBy(desc(userAIHistory.updatedAt));
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
    return {
      data: cleanedHistory,
    };
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

const createNewTab = async (userId: number, tabName: string) => {
  try {
    const summarizedTabName = await summarize(tabName, "title");
    const [newTab] = await db
      .insert(userAiTabs)
      .values({
        userId: Number(userId),
        tabName: summarizedTabName.summary || summarizedTabName,
        tabSummary: summarizedTabName.summary || summarizedTabName,
      })
      .returning({ id: userAiTabs.id });
    const cacheKey = `aiTabs:${userId}:page:1`;
    const cached = await redis.get(cacheKey);
    const parseData = cached ? JSON.parse(cached) : null;
    if (parseData) {
      const updatedCache = [newTab, ...parseData];
      await redis.set(cacheKey, JSON.stringify(updatedCache), {
        EX: 60 * 60 * 24,
      });
    }
    return {
      tabId: newTab.id,
      tabName: summarizedTabName.summary || summarizedTabName,
    };
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

const summarize = async (text: string, outputType: "title" | "summary") => {
  if ([...text].length < 50) {
    return { summary: text };
  }
  const response = await axios.post(
    `${process.env.AI_URL_LOCAL}/summarize`,
    {
      text,
      outputType,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.INTERNAL_API_KEY,
      },
    }
  );
  return response.data;
};
