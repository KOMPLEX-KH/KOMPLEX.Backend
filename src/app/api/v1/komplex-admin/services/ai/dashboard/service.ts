import { db } from "@/db/index.js";
import { userAIHistory, userAITopicHistory } from "@/db/schema.js";
import { sql } from "drizzle-orm";

export const getAiDashboard = async () => {
  try {
    // Get total prompts from both tables
    const totalPromptsResult = await db
      .execute(
        sql`
          SELECT COUNT(*) as total_prompts
          FROM (
            SELECT id FROM user_ai_history
            UNION ALL
            SELECT id FROM user_ai_topic_history
          ) as combined
        `
      )
      .then((res) => res.rows[0] as { total_prompts: string });

    const totalPrompts = parseInt(totalPromptsResult.total_prompts || "0", 10);

    // Get unique users count
    const uniqueUsersResult = await db
      .execute(
        sql`
          SELECT COUNT(DISTINCT user_id) as unique_users
          FROM (
            SELECT user_id FROM user_ai_history
            UNION
            SELECT user_id FROM user_ai_topic_history
          ) as combined_users
        `
      )
      .then((res) => res.rows[0] as { unique_users: string });

    const uniqueUsers = parseInt(uniqueUsersResult.unique_users || "0", 10);

    // Calculate average prompts per user
    const averagePromptsPerUser =
      uniqueUsers > 0 ? totalPrompts / uniqueUsers : 0;

    // Get average rating from both tables
    const averageRatingResult = await db
      .execute(
        sql`
          SELECT AVG(rating) as avg_rating
          FROM (
            SELECT rating FROM user_ai_history WHERE rating IS NOT NULL
            UNION ALL
            SELECT rating FROM user_ai_topic_history WHERE rating IS NOT NULL
          ) as combined_ratings
        `
      )
      .then((res) => res.rows[0] as { avg_rating: string | null });

    const averageRating = averageRatingResult.avg_rating
      ? parseFloat(averageRatingResult.avg_rating)
      : null;

    // Get response type distribution
    const responseTypeResult = await db
      .execute(
        sql`
          SELECT 
            response_type,
            COUNT(*) as count
          FROM (
            SELECT response_type FROM user_ai_history
            UNION ALL
            SELECT response_type FROM user_ai_topic_history
          ) as combined_types
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
        totalPrompts,
        averagePromptsPerUser: Math.round(averagePromptsPerUser * 100) / 100,
        averageRating: averageRating
          ? Math.round(averageRating * 100) / 100
          : null,
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
