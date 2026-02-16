import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { topics, userAITopicHistory } from "@/db/drizzle/schema.js";
import { eq, desc } from "drizzle-orm";
import axios from "axios";
import { cleanKomplexResponse } from "@/utils/cleanKomplexResponse.js";
import { z } from "@/config/openapi/openapi.js";

export const MeCallAiTopicParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MeCallAiTopicParams");

export const MeCallAiTopicBodySchema = z
  .object({
    prompt: z.string(),
    responseType: z.string(),
  })
  .openapi("MeCallAiTopicBody");

export const MeCallAiTopicResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      prompt: z.string(),
      responseType: z.string(),
      aiResult: z.string(),
      id: z.number(),
    }),
  })
  .openapi("MeCallAiTopicResponse");

export const callAiTopic = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { prompt, responseType } =
      await MeCallAiTopicBodySchema.parseAsync(req.body);
    const { id } = await MeCallAiTopicParamsSchema.parseAsync(req.params);

    const result = await callAiTopicAndWriteToTopicHistory(
      prompt,
      responseType,
      Number(userId),
      id
    );
    const responseBody = MeCallAiTopicResponseSchema.parse({
      success: true,
      message: "AI topic called successfully",
      data: result,
    });
    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};

export const callAiTopicAndWriteToTopicHistory = async (
  prompt: string,
  responseType: string,
  userId: number,
  id: string
) => {
  try {
    const topic = await db
      .select()
      .from(topics)
      .where(eq(topics.id, Number(id)));
    const topicContent = topic[0].component;
    if (!topicContent) {
      throw new ResponseError("Topic not found", 404);
    }

    const previousContext = await db
      .select({
        prompt: userAITopicHistory.prompt,
        aiResult: userAITopicHistory.aiResult,
        summary: userAITopicHistory.summary,
      })
      .from(userAITopicHistory)
      .where(eq(userAITopicHistory.topicId, Number(id)))
      .orderBy(desc(userAITopicHistory.createdAt))
      .limit(3)
      .then((res) => {
        const historyContext = res
          // .map((r) => r.summary || `${r.prompt}\n${r.aiResult}`)
          .map((r) => `${r.prompt}\n${r.aiResult}`)
          .join("\n");

        return topicContent + historyContext;
      });

    const response = await axios.post(
      `${process.env.DARA_ENDPOINT}/topic/gemini`,
      {
        prompt,
        topicContent,
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

    const [lastResponse] = await db
      .insert(userAITopicHistory)
      .values({
        userId,
        topicId: Number(id),
        prompt,
        aiResult,
        rating: null,
        responseType: responseType as "normal" | "komplex",
      })
      .returning();

    // const summarizeCounterCacheKey = `summarizeCounter:topic:${userId}:topicId:${id}`;
    // const currentCountRaw = await redis.get(summarizeCounterCacheKey);
    // const currentCount = currentCountRaw ? parseInt(currentCountRaw, 10) : 0;

    // if (currentCount >= 5) {
    //   const summaryResult = await summarize(aiResult, "summary");
    //   const summary = summaryResult.summary || aiResult;

    //   await db
    //     .update(userAITopicHistory)
    //     .set({ summary })
    //     .where(eq(userAITopicHistory.id, lastResponse.id));

    //   await redis.set(summarizeCounterCacheKey, "0", {
    //     EX: 60 * 60 * 24 * 3,
    //   });
    // } else {
    //   await redis.set(summarizeCounterCacheKey, (currentCount + 1).toString(), {
    //     EX: 60 * 60 * 24 * 3,
    //   });
    // }
    // to change when pages is really implemented
    const cacheKey = `aiTopicHistory:${userId}:topicId:${id}:page:1`;
    await redis.del(cacheKey);
    return {
      prompt,
      responseType,
      aiResult,
      id: lastResponse.id,
    };
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};