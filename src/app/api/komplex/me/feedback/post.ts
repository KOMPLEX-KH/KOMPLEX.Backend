import { db } from "@/db/drizzle/index.js";
import { feedbacks } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { ResponseError, getResponseError } from "@/utils/response.js";
import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";
import { z } from "@/config/openapi/openapi.js";

export const MePostFeedbackBodySchema = z
  .object({
    content: z.string(),
    type: z.string(),
  })
  .openapi("MePostFeedbackBody");

export const MePostFeedbackResponseSchema = z
  .array(z.any())
  .openapi("MePostFeedbackResponse");

export const postFeedback = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { content, type } = await MePostFeedbackBodySchema.parseAsync(
      req.body
    );
    const userID = Number(userId) === 0 ? null : Number(userId);
    const feedback = await db
      .insert(feedbacks)
      .values({
        content,
        type,
        userId: userID,
        status: "unresolved",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    const cacheKey = `feedback:${feedback[0].id}`;
    await redis.set(cacheKey, JSON.stringify(feedback[0]), { EX: 600 });

    const responseBody = MePostFeedbackResponseSchema.parse(feedback);

    return res.status(201).json(responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};
