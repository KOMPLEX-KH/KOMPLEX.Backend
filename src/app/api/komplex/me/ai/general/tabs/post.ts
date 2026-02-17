import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, getResponseSuccess, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { userAiTabs } from "@/db/drizzle/models/user_ai_tabs.js";
import { redis } from "@/db/redis/redis.js";
import axios from "axios";
import { z } from "@/config/openapi/openapi.js";

export const MeCreateAiGeneralTabBodySchema = z
  .object({
    prompt: z.string(),
    responseType: z.string(),
  })
  .openapi("MeCreateAiGeneralTabBody");

export const MeCreateAiGeneralTabResponseSchema = z
  .object({
    prompt: z.string(),
    responseType: z.string(),
    id: z.number(),
    name: z.string(),
  })
  .openapi("MeCreateAiGeneralTabResponse");

export const createAiGeneralTab = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { prompt, responseType } =
      await MeCreateAiGeneralTabBodySchema.parseAsync(req.body);

    const result = await callAiFirstTimeService(
      prompt,
      responseType,
      Number(userId)
    );
    const responseBody = MeCreateAiGeneralTabResponseSchema.parse(result);
    return getResponseSuccess(res, responseBody, "AI general first time called successfully");
  } catch (error) {
    return getResponseError(res, error);
  }
};

export const callAiFirstTimeService = async (
  prompt: string,
  responseType: string,
  userId: number
) => {
  try {
    const tabIdAndTabName = await createNewTab(
      userId,
      prompt.charAt(0).toUpperCase() + prompt.slice(1)
    );
    // const response = await axios.post(
    //   `${process.env.DARA_ENDPOINT}/gemini`,
    //   {
    //     prompt,
    //     responseType,
    //     previousContext: "",
    //   },
    //   {
    //     headers: {
    //       "Content-Type": "application/json",
    //       "x-api-key": process.env.INTERNAL_API_KEY,
    //     },
    //   }
    // );
    // const result = response.data;
    // const aiResult = result.result;
    // if (aiResult) {
    //   await db.insert(userAIHistory).values({
    //     userId: Number(userId),
    //     prompt: prompt,
    //     aiResult: cleanKomplexResponse(
    //       aiResult,
    //       responseType as "normal" | "komplex"
    //     ),
    //     tabId: tabIdAndTabName.tabId,
    //     responseType: responseType as "normal" | "komplex",
    //   });
    //   await db
    //     .update(userAiTabs)
    //     .set({
    //       tabSummary: tabIdAndTabName.tabName,
    //     })
    //     .where(eq(userAiTabs.id, tabIdAndTabName.tabId));
    //   const cacheKey = `previousContext:${userId}:tabId:${tabIdAndTabName.tabId}`;
    //   await redis.set(cacheKey, JSON.stringify(aiResult), { EX: 60 * 60 * 24 });
    //   const summarizeCounterCacheKey = `summarizeCounter:${userId}:tabId:${tabIdAndTabName.tabId}`;
    //   await redis.set(summarizeCounterCacheKey, "0", { EX: 60 * 60 * 24 * 3 });
    // }
    return tabIdAndTabName;
  } catch (error) {
    throw new ResponseError(error as string, 500);
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
    throw new ResponseError(error as string, 500);
  }
};

// only use for tab summary for now
// currently not in use
export const summarize = async (
  text: string,
  outputType: "title" | "summary"
) => {
  try {
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
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};