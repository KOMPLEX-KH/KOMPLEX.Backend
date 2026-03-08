import { Request, Response } from "express";
import { getResponseError } from "@/utils/response.js";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { feedbacks, feedbackMedia, users } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { z } from "@/config/openapi/openapi.js";

export const GetFeedbacksQuerySchema = z.object({
  page: z.number().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
}).openapi("GetFeedbacksQuery");

export const GetFeedbacksResponseSchema = z.object({
  feedbacksWithMedia: z.array(z.object({
    id: z.number(),
    userId: z.number(),
    content: z.string(),
  })),
  hasMore: z.boolean(),
}).openapi("GetFeedbacksResponse");

export const getFeedbacks = async (req: Request, res: Response) => {
  try {
    const { page, status, type } = await GetFeedbacksQuerySchema.parseAsync(req.query);
    const pageNumber = Number(page) || 1;
    const limit = 20;
    const offset = (pageNumber - 1) * limit;

    const feedbackIds = await db
      .select({ id: feedbacks.id })
      .from(feedbacks)
      .orderBy(desc(feedbacks.updatedAt))
      .offset(offset)
      .limit(limit);

    const feedbackIdRows = feedbackIds.map((f) => ({ id: f.id }));

    if (!feedbackIdRows.length)
      return res.status(200).json(GetFeedbacksResponseSchema.parse({ feedbacksWithMedia: [], hasMore: false }));

    const cachedResults = (await redis.mGet(
      feedbackIdRows.map((b) => `feedbacks:${b.id}`)
    )) as (string | null)[];

    const hits: any[] = [];
    const missedIds: number[] = [];

    if (cachedResults.length > 0) {
      cachedResults.forEach((item, idx) => {
        if (item) hits.push(JSON.parse(item));
        else missedIds.push(feedbackIdRows[idx].id);
      });
    }

    let missedFeedbacks: any[] = [];
    if (missedIds.length > 0) {
      const feedbackRows = await db
        .select({
          id: feedbacks.id,
          userId: feedbacks.userId,
          content: feedbacks.content,
          type: feedbacks.type,
          createdAt: feedbacks.createdAt,
          updatedAt: feedbacks.updatedAt,
          username: sql`${users.firstName} || ' ' || ${users.lastName}`,
          mediaUrl: feedbackMedia.publicUrl,
        })
        .from(feedbacks)
        .leftJoin(feedbackMedia, eq(feedbacks.id, feedbackMedia.feedbackId))
        .leftJoin(users, eq(feedbacks.userId, users.id))
        .where(inArray(feedbacks.id, missedIds));

      missedFeedbacks = feedbackRows;

      for (const feedback of missedFeedbacks) {
        await redis.set(`feedbacks:${feedback.id}`, JSON.stringify(feedback), {
          EX: 600,
        });
      }
    }

    const allFeedbackMap = new Map<number, any>();
    hits.forEach((user) => allFeedbackMap.set(user.id, user));
    missedFeedbacks.forEach((user) => allFeedbackMap.set(user.id, user));
    const allFeedbacks = feedbackIds.map((r) => allFeedbackMap.get(r.id));

    return res.status(200).json(GetFeedbacksResponseSchema.parse({
      feedbacksWithMedia: allFeedbacks.map((f) => ({
        id: f.id as number,
        userId: f.userId as number,
        content: f.content as string,
      })),
      hasMore: feedbackIds.length === limit,
    }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
