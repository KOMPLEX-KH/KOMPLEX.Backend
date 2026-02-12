import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { topics } from "@/db/models/topics.js";
import { redis } from "@/db/redis/redisConfig.js";
import { users } from "@/db/models/users.js";

export const getCurriculumTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    // Try fetching cached value
    const cached = await redis.get(`topic:${id}`);
    if (cached) {
      if (userId !== 0) {
        const [updatedUser] = await db
          .update(users)
          .set({ lastTopicId: Number(id) })
          .where(eq(users.id, userId))
          .returning();
        if (!updatedUser) {
          return getResponseError(res, new ResponseError("Failed to update user last topic", 500));
        }
      }
      return res.status(200).json({ data: JSON.parse(cached) });
    }

    // If not cached, fetch from database
    const [topic] = await db
      .select()
      .from(topics)
      .where(eq(topics.id, Number(id)));

    if (!topic) {
      return getResponseError(res, new ResponseError("Topic not found", 404));
    }

    if (userId !== 0) {
      const [updatedUser] = await db
        .update(users)
        .set({ lastTopicId: Number(id) })
        .where(eq(users.id, userId))
        .returning();
      if (!updatedUser) {
        return getResponseError(res, new ResponseError("Failed to update user last topic", 500));
      }
    }

    // Cache the topic info
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

    return res.status(200).json({
      data: { component: topic.component, componentCode: topic.componentCode },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
