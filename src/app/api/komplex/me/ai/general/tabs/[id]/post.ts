import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { userAIHistory } from "@/db/drizzle/schema.js";
import { userAiTabs } from "@/db/drizzle/models/user_ai_tabs.js";
import { and, eq, desc } from "drizzle-orm";
import axios from "axios";
import { cleanKomplexResponse } from "@/utils/cleanKomplexResponse.js";
import { z } from "@/config/openapi/openapi.js";

export const MePostAiGeneralParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MePostAiGeneralParams");

export const MePostAiGeneralBodySchema = z
  .object({
    prompt: z.string(),
    responseType: z.string(),
  })
  .openapi("MePostAiGeneralBody");

export const MePostAiGeneralResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      prompt: z.string(),
      aiResult: z.string(),
      responseType: z.string(),
      id: z.number().optional(),
    }),
  })
  .openapi("MePostAiGeneralResponse");

export const postAiGeneral = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { prompt, responseType } = await MePostAiGeneralBodySchema.parseAsync(
      req.body
    );
    const { id } = await MePostAiGeneralParamsSchema.parseAsync(req.params);

    const result = await callAiGeneralServiceInternal(
      prompt,
      responseType,
      Number(userId),
      Number(id)
    );

    const responseBody = MePostAiGeneralResponseSchema.parse({
      success: true,
      message: "AI general called successfully",
      data: result,
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};

const callAiGeneralServiceInternal = async (
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
    throw new ResponseError(error as string, 500);
  }
};
