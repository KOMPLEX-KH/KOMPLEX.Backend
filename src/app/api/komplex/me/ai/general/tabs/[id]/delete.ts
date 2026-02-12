import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { userAIHistory } from "@/db/schema.js";
import { userAiTabs } from "@/db/models/user_ai_tabs.js";
import { redis } from "@/db/redis/redisConfig.js";
import { and, eq } from "drizzle-orm";

export const deleteAiGeneralTab = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const result = await deleteAiGeneralTabInternal(
      Number(userId),
      Number(id)
    );
    return res.status(200).json({
      success: true,
      message: "AI general tab deleted successfully",
      data: result,
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};

const deleteAiGeneralTabInternal = async (userId: number, tabId: number) => {
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
    throw new ResponseError(error as string, 500);
  }
};
