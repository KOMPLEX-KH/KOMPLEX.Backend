import { Request, Response } from "express";
import { getResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { userAIHistory } from "@/db/drizzle/schema.js";
import { sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const GeneralAiDashboardResponseSchema = z.object({
  averageRating: z.number().nullable(),
  responseTypeDistribution: z.object({
    normal: z.number(),
    komplex: z.number(),
  }),
}).openapi("GeneralAiDashboardResponse");

export const getGeneralAiDashboard = async (req: Request, res: Response) => {
  try {
    const averageRatingResult = await db
      .select({
        avgRating: sql<number>`AVG(${userAIHistory.rating})`.as("avg_rating"),
      })
      .from(userAIHistory)
      .where(sql`${userAIHistory.rating} IS NOT NULL`)
      .then(
        (r) => r[0] as unknown as { avgRating: string | null } | undefined
      );

    const averageRating = averageRatingResult?.avgRating
      ? parseFloat(averageRatingResult.avgRating ?? "0")
      : null;

    const responseTypeResult = await db
      .execute(
        sql`
          SELECT 
            response_type,
            COUNT(*) as count
          FROM user_ai_history
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
      data: GeneralAiDashboardResponseSchema.parse({
        averageRating: averageRating
          ? Math.round(averageRating * 100) / 100
          : null,
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

