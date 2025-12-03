import { db } from "@/db/index.js";
import { userAIHistory } from "@/db/models/user_ai_history.js";
import { userAiTabs } from "@/db/models/user_ai_tabs.js";
import { redis } from "@/db/redis/redisConfig.js";
import { cleanKomplexResponse } from "@/utils/cleanKomplexResponse.js";
import axios from "axios";
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

export const callAiFirstTimeService = async (
  prompt: string,
  responseType: string,
  userId: number
) => {
  try {
    const tabIdAndTabName = await createNewTab(userId, prompt);
    const response = await axios.post(
      `${process.env.DARA_ENDPOINT}/gemini`,
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
        aiResult: cleanKomplexResponse(
          aiResult,
          responseType as "normal" | "komplex"
        ),
        tabId: tabIdAndTabName.tabId,
        responseType: responseType as "normal" | "komplex",
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
      aiResult,
      responseType,
      id: tabIdAndTabName.tabId,
      name: tabIdAndTabName.tabName,
    };
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

const createNewTab = async (userId: number, tabName: string) => {
  try {
    // const summarizedTabName = await summarize(tabName, "title");
    const [newTab] = await db
      .insert(userAiTabs)
      .values({
        userId: Number(userId),
        tabName: tabName, // not  using summarized because not good enough
        tabSummary: tabName,
      })
      .returning({ id: userAiTabs.id });

    const cacheKeys: string[] = await redis.keys(`aiTabs:${userId}:page:*`);
    if (cacheKeys.length > 0) {
      await redis.del(cacheKeys);
    }

    return {
      tabId: newTab.id,
      tabName: tabName,
    };
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

// only use for tab summary for now

export const summarize = async (
  text: string,
  outputType: "title" | "summary"
) => {
  const response = await axios.post(
    `${process.env.DARA_ENDPOINT}/summarize`,
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
