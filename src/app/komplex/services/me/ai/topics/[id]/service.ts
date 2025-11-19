import { desc, eq, and } from "drizzle-orm";
import { db } from "@/db/index.js";
import { topics } from "@/db/models/topics.js";
import { userAITopicHistory } from "@/db/models/user_ai_topic_history.js";
import axios from "axios";
import { cleanKomplexResponse } from "../../../../../../../utils/cleanKomplexResponse.js";
import { redis } from "@/db/redis/redisConfig.js";

export const callAiTopicAndWriteToTopicHistory = async (
  prompt: string,
  responseType: string,
  userId: number,
  id: string
) => {
  try {
    const topic = await db
      .select()
      .from(topics)
      .where(eq(topics.id, Number(id)));
    const topicContent = topic[0].component;
    if (!topicContent) {
      throw new Error("Topic not found");
    }

    const previousContext = await db
      .select()
      .from(userAITopicHistory)
      .where(eq(userAITopicHistory.topicId, Number(id)))
      .orderBy(desc(userAITopicHistory.createdAt))
      .limit(5)
      .then((res) => res.map((r) => r.prompt).join("\n"));

    const response = await axios.post(
      `${process.env.DARA_ENDPOINT}/topic/gemini`,
      {
        prompt,
        topicContent,
        responseType,
        previousContext,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.INTERNAL_API_KEY,
        },
      }
    );
    const result = response.data;
    const aiResult = cleanKomplexResponse(result.result ?? "", responseType);
    const lastResponse = await db
      .insert(userAITopicHistory)
      .values({
        userId,
        topicId: Number(id),
        prompt,
        aiResult,
        rating: null,
        responseType: responseType as "normal" | "komplex",
      })
      .returning();
    return {
      prompt,
      responseType,
      data: {
        aiResult,
        id: lastResponse[0].id,
      },
    };
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export const getAiTopicHistory = async (
  userId: number,
  topicId: string,
  page?: number,
  limit?: number,
  offset?: number
) => {
  try {
    // const cacheKey = `aiTopicHistory:${userId}:page:${page ?? 1}`;
    // await redis.del(cacheKey);
    // const cached = await redis.get(cacheKey);
    // const parseData = cached ? JSON.parse(cached) : null;
    // if (parseData) {
    //   return {
    //     data: parseData.slice((limit ?? 20) - parseData.length),
    //     hasMore: parseData.length === (limit ?? 20),
    //   };
    // }
    const history = await db
      .select()
      .from(userAITopicHistory)
      .where(
        and(
          eq(userAITopicHistory.userId, Number(userId)),
          eq(userAITopicHistory.topicId, Number(topicId))
        )
      )
      .orderBy(desc(userAITopicHistory.createdAt))
      .limit(limit ?? 20)
      .offset(((page ?? 1) - 1) * (limit ?? 20));
    const reversedHistory = history.reverse();
    // await redis.set(cacheKey, JSON.stringify(reversedHistory), {
    //   EX: 60 * 60 * 24,
    // });
    return {
      data: reversedHistory,
      hasMore: history.length === (limit ?? 20),
    };
  } catch (error) {
    throw new Error((error as Error).message);
  }
};
