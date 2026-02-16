import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { userAIHistory } from "@/db/drizzle/schema.js";
import { userAiTabs } from "@/db/drizzle/models/user_ai_tabs.js";
import { redis } from "@/db/redis/redis.js";
import { and, eq } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const MeDeleteAiGeneralTabParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MeDeleteAiGeneralTabParams");

export const MeDeleteAiGeneralTabResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      data: z.array(z.any()),
    }),
  })
  .openapi("MeDeleteAiGeneralTabResponse");

export const deleteAiGeneralTab = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = await MeDeleteAiGeneralTabParamsSchema.parseAsync(
      req.params
    );
    const { userId } = req.user;

    const result = await deleteAiGeneralTabInternal(
      Number(userId),
      Number(id)
    );
    const responseBody = MeDeleteAiGeneralTabResponseSchema.parse({
      success: true,
      message: "AI general tab deleted successfully",
      data: result,
    });
    return res.status(200).json(responseBody);
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
