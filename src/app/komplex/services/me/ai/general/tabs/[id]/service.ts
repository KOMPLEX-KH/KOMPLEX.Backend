import { cleanKomplexResponse } from "@/utils/cleanKomplexResponse.js";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { userAIHistory } from "@/db/models/user_ai_history.js";
import { eq, desc, and, asc } from "drizzle-orm";
import axios from "axios";
import { userAiTabs } from "@/db/models/user_ai_tabs.js";
import { userAITopicHistory, users } from "@/db/schema.js";
// import { summarize } from "../../service.js";

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
    // let summary;
    if (Array.isArray(cacheData) && cacheData.length >= 5) {
      previousContext = cacheData;
    } else {
      // summary = await db
      //   .select({
      //     tabSummary: userAiTabs.tabSummary,
      //   })
      //   .from(userAiTabs)
      //   .where(
      //     and(eq(userAiTabs.userId, Number(userId)), eq(userAiTabs.id, tabId))
      //   );
      previousContext = await db
        .select({
          prompt: userAIHistory.prompt,
          aiResult: userAIHistory.aiResult,
        })
        .from(userAIHistory)
        .where(
          and(
            eq(userAIHistory.tabId, tabId),
            eq(userAIHistory.userId, Number(userId))
          )
        )
        .orderBy(desc(userAIHistory.updatedAt))
        .limit(3);
      // previousContext =
      //   summary[0].tabSummary +
      //   previousContext.map((p) => p.prompt).join("\n") +
      //   previousContext.map((p) => p.aiResult).join("\n");
      await redis.set(cacheKey, JSON.stringify(previousContext), {
        EX: 60 * 60 * 24,
      });
    }
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
    const aiResult = cleanKomplexResponse(
      result.result,
      responseType as "normal" | "komplex"
    );
    let lastResponse;
    if (aiResult) {
      lastResponse = await db
        .insert(userAIHistory)
        .values({
          userId: Number(userId),
          prompt: prompt,
          aiResult: aiResult,
          responseType: responseType as "normal" | "komplex",
          tabId: tabId,
        })
        .returning();
      // const summarizeCounterCacheKey = `summarizeCounter:${userId}:tabId:${tabId}`;
      // const currentCountRaw = await redis.get(summarizeCounterCacheKey);
      // const currentCount = currentCountRaw ? parseInt(currentCountRaw, 10) : 0;
      // if (currentCount >= 5) {
      //   const summaryText = await summarize(aiResult, "summary");
      //   await db
      //     .update(userAiTabs)
      //     .set({
      //       tabSummary: summaryText.summary || aiResult,
      //     })
      //     .where(eq(userAiTabs.id, tabId));
      //   await redis.set(summarizeCounterCacheKey, "0", {
      //     EX: 60 * 60 * 24 * 3,
      //   });
      // } else {
      //   await redis.set(
      //     summarizeCounterCacheKey,
      //     (currentCount + 1).toString(),
      //     { EX: 60 * 60 * 24 * 3 }
      //   );
      // }
    }
    
    return { prompt, aiResult, responseType, id: lastResponse?.[0]?.id };
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
    throw new Error((error as Error).message);
  }
};

export const deleteAiGeneralTab = async (userId: number, tabId: number) => {
  try {
    const response = await db
      .delete(userAIHistory)
      .where(
        and(eq(userAIHistory.userId, userId), eq(userAIHistory.tabId, tabId))
      )
      .returning();
    await db.delete(userAiTabs).where(eq(userAiTabs.id, tabId));
    await redis.flushAll(); // TO CHANGE
    return { data: response };
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export const editAiGeneralTab = async (
  userId: number,
  tabId: number,
  tabName: string
) => {
  try {
    const response = await db
      .update(userAiTabs)
      .set({ tabName })
      .where(and(eq(userAiTabs.userId, userId), eq(userAiTabs.id, tabId)))
      .returning();
    await redis.flushAll(); // TO CHANGE
    return { data: response };
  } catch (error) {
    throw new Error((error as Error).message);
  }
};
