import { Request, Response } from "express";
import { getResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { userAITopicHistory, topics } from "@/db/drizzle/schema.js";
import { sql, desc } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const TopicAiDashboardResponseSchema = z.object({
  mostAskedTopics: z.array(z.object({
    topicId: z.number(),
    topicName: z.string(),
    promptCount: z.number(),
  })),
  responseTypeDistribution: z.object({
    normal: z.number(),
    komplex: z.number(),
  }),
}).openapi("TopicAiDashboardResponse");

export const getTopicAiDashboard = async (req: Request, res: Response) => {
  try {
    const mostAskedTopics = await db
      .select({
        topicId: userAITopicHistory.topicId,
        topicName: topics.name,
        promptCount: sql<number>`COUNT(*)`.as("prompt_count"),
      })
      .from(userAITopicHistory)
      .innerJoin(topics, sql`${userAITopicHistory.topicId} = ${topics.id}`)
      .groupBy(userAITopicHistory.topicId, topics.name)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10)
      .then((rows) =>
        rows.map((row) => ({
          topicId: row.topicId,
          topicName: row.topicName,
          promptCount: parseInt(String(row.promptCount), 10),
        }))
      );

    const responseTypeResult = await db
      .execute(
        sql`
          SELECT 
            response_type,
            COUNT(*) as count
          FROM user_ai_topic_history
          GROUP BY response_type
        `
      )
      .then((r) => r.rows as { response_type: string; count: string }[]);

    const totalForDistribution = responseTypeResult.reduce(
      (sum, row) => sum + parseInt(row.count || "0", 10),
      0
    );

    const responseTypeDistribution = {
      normal: 0,
      komplex: 0,
    };

    responseTypeResult.forEach((row) => {
      const count = parseInt(row.count || "0", 10);
      const percentage =
        totalForDistribution > 0 ? (count / totalForDistribution) * 100 : 0;
      if (row.response_type === "normal") {
        responseTypeDistribution.normal = percentage;
      } else if (row.response_type === "komplex") {
        responseTypeDistribution.komplex = percentage;
      }
    });

    return res.status(200).json({
      data: TopicAiDashboardResponseSchema.parse({
        mostAskedTopics,
        responseTypeDistribution: {
          normal:
            Math.round(responseTypeDistribution.normal * 100) / 100,
          komplex:
            Math.round(responseTypeDistribution.komplex * 100) / 100,
        },
      }),
    });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

