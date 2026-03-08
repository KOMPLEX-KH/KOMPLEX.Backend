import { Request, Response } from "express";
import { getResponseError } from "@/utils/response.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { feedbacks } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { z } from "@/config/openapi/openapi.js";

export const UpdateFeedbackStatusParamsSchema = z.object({
  id: z.string(),
}).openapi("UpdateFeedbackStatusParams");

export const UpdateFeedbackStatusBodySchema = z.object({
  status: z.string(),
}).openapi("UpdateFeedbackStatusBody");

export const UpdateFeedbackStatusResponseSchema = z.object({
  message: z.string(),
}).openapi("UpdateFeedbackStatusResponse");

export const updateFeedbackStatus = async (req: Request, res: Response) => {
  try {
    const { id } = await UpdateFeedbackStatusParamsSchema.parseAsync(req.params);
    const { status } = await UpdateFeedbackStatusBodySchema.parseAsync(req.body);

    await db
      .update(feedbacks)
      .set({ status: status as "resolved" | "unresolved" | "dismissed" })
      .where(eq(feedbacks.id, Number(id)));

    const cacheKey = `feedbacks:${id}`;
    await redis.set(cacheKey, JSON.stringify({ status }), {
      EX: 600,
    });

    return res.status(200).json(UpdateFeedbackStatusResponseSchema.parse({ message: "Feedback status updated successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
