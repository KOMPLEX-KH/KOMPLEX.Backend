import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, getResponseSuccess, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { userAiTabs } from "@/db/drizzle/models/user_ai_tabs.js";
import { redis } from "@/db/redis/redis.js";
import { and, eq } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const MeUpdateAiGeneralTabParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MeUpdateAiGeneralTabParams");

export const MeUpdateAiGeneralTabBodySchema = z
  .object({
    tabName: z.string(),
  })
  .openapi("MeUpdateAiGeneralTabBody");

export const MeUpdateAiGeneralTabResponseSchema = z
  .object({
    data: z.array(z.any()),
  })
  .openapi("MeUpdateAiGeneralTabResponse");

export const updateAiGeneralTab = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = await MeUpdateAiGeneralTabParamsSchema.parseAsync(
      req.params
    );
    const { userId } = req.user;
    const { tabName } = await MeUpdateAiGeneralTabBodySchema.parseAsync(
      req.body
    );

    const result = await editAiGeneralTabInternal(
      Number(userId),
      Number(id),
      tabName
    );
    const responseBody = MeUpdateAiGeneralTabResponseSchema.parse(result);
    return getResponseSuccess(res, responseBody, "AI general tab edited successfully");
  } catch (error) {
    return getResponseError(res, error);
  }
};

const editAiGeneralTabInternal = async (
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
    return response;
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};

