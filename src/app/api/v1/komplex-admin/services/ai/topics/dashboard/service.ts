import { db } from "@/db/index.js";
import { userAITopicHistory, topics } from "@/db/schema.js";
import { sql, desc } from "drizzle-orm";

export const getTopicAiDashboard = async () => {
  try {
    // Get most asked topics (top 10)
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
      .then((res) =>
        res.map((row) => ({
          topicId: row.topicId,
          topicName: row.topicName,
          promptCount: parseInt(String(row.promptCount), 10),
        }))
      );

    // Get response type distribution
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
      .then((res) => res.rows as { response_type: string; count: string }[]);

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

    return {
      data: {
        mostAskedTopics,
        responseTypeDistribution: {
          normal: Math.round(responseTypeDistribution.normal * 100) / 100,
          komplex: Math.round(responseTypeDistribution.komplex * 100) / 100,
        },
      },
    };
  } catch (error) {
    throw new Error((error as Error).message);
  }
};
