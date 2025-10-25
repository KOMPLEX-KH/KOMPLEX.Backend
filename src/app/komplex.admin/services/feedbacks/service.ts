import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { feedbacks, feedbackMedia, users } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const getFeedbacks = async (
  page: number = 1,
  status?: string,
  type?: string
) => {
  try {
    const limit = 20;
    const offset = (page - 1) * limit;

    const feedbackIds = await db
      .select({ id: feedbacks.id })
      .from(feedbacks)
      .orderBy(desc(feedbacks.updatedAt))
      .offset(offset)
      .limit(limit);

    const feedbackIdRows = feedbackIds.map((f) => ({ id: f.id }));

    if (!feedbackIdRows.length)
      return { feedbacksWithMedia: [], hasMore: false };

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

    return {
      feedbacksWithMedia: allFeedbacks,
      hasMore: allFeedbacks.length === limit,
    };
  } catch (error) {
    throw new Error(`Failed to get feedbacks: ${(error as Error).message}`);
  }
};
