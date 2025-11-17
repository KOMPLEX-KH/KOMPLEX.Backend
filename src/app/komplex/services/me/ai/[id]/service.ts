import { desc, eq } from "drizzle-orm";

import { db } from "@/db/index.js";
import { topics } from "@/db/models/topics.js";
import { userAITopicHistory } from "@/db/models/user_ai_topic_history.js";
import axios from "axios";
import { cleanKomplexResponse } from "../../../../../../utils/cleanKomplexResponse.js";

export const getAiTopicResponse = async (
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
    await db.insert(userAITopicHistory).values({
      userId,
      topicId: Number(id),
      prompt,
      aiResult,
      responseType: responseType as "normal" | "komplex",
    });
    return { prompt, responseType, data: aiResult };
  } catch (error) {
    throw new Error((error as Error).message);
  }
};
