import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { userAiTabs } from "@/db/models/user_ai_tabs.js";
import { redis } from "@/db/redis/redisConfig.js";
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
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      data: z.array(z.any()),
    }),
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
    const responseBody = MeUpdateAiGeneralTabResponseSchema.parse({
      success: true,
      message: "AI general tab edited successfully",
      data: result,
    });
    return res.status(200).json(responseBody);
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
    return { data: response };
  } catch (error) {
    throw new ResponseError(error as string, 500);
  }
};

