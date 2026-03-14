import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { sendResponseError, sendResponseSuccess, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { eq } from "drizzle-orm";
import { topics, users } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { z } from "@/config/openapi/openapi.js";

export const CurriculumTopicResponseSchema = z.object({
  component: z.array(z.any()),
  componentCode: z.string(),
}).openapi("CurriculumTopicResponse");

export const getCurriculumTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const cached = await redis.get(`topic:${id}`);
    if (cached) {
      if (userId !== 0) {
        const [updatedUser] = await db
          .update(users)
          .set({ lastTopicId: Number(id) })
          .where(eq(users.id, userId))
          .returning();
        if (!updatedUser) {
          return sendResponseError(res, new ResponseError("Failed to update user last topic", 500));
        }
      }
      const responseBody = CurriculumTopicResponseSchema.parse(JSON.parse(cached));
      return sendResponseSuccess(res, responseBody);
    }

    const [topic] = await db
      .select()
      .from(topics)
      .where(eq(topics.id, Number(id)));

    if (!topic) {
      return sendResponseError(res, new ResponseError("Topic not found", 404));
    }

    if (userId !== 0) {
      const [updatedUser] = await db
        .update(users)
        .set({ lastTopicId: Number(id) })
        .where(eq(users.id, userId))
        .returning();
      if (!updatedUser) {
        return sendResponseError(res, new ResponseError("Failed to update user last topic", 500));
      }
    }

    await redis.set(
      `topic:${id}`,
      JSON.stringify({
        component: topic.component,
        componentCode: topic.componentCode,
      }),
      {
        EX: 60 * 60 * 24,
      }
    );

    const responseBody = CurriculumTopicResponseSchema.parse({
      component: topic.component,
      componentCode: topic.componentCode,
    });
    return sendResponseSuccess(res, responseBody);
  } catch (error) {
    return sendResponseError(res, error);
  }
};
