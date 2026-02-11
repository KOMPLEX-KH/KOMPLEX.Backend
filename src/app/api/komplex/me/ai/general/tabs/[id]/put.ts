import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { userAiTabs } from "@/db/models/user_ai_tabs.js";
import { redis } from "@/db/redis/redisConfig.js";
import { and, eq } from "drizzle-orm";

export const updateAiGeneralTab = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { tabName } = req.body;

    const result = await editAiGeneralTabInternal(
      Number(userId),
      Number(id),
      tabName
    );
    return res.status(200).json({
      success: true,
      message: "AI general tab edited successfully",
      data: result,
    });
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

