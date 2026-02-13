import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { count, avg } from "drizzle-orm";
import { db } from "@/db/index.js";
import { exercises, userExerciseHistory } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";
import { z } from "@/config/openapi/openapi.js";

export const GetExerciseDashboardResponseSchema = z.object({
  totalExercises: z.number(),
  totalAttempts: z.number(),
  averageScore: z.number(),
}).openapi("GetExerciseDashboardResponse");

export const getExerciseDashboard = async (req: Request, res: Response) => {
  try {
    const cacheKey = `exercise:dashboard`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(GetExerciseDashboardResponseSchema.parse(JSON.parse(cachedData)));
    }

    const result = await db
      .select({
        count: count(exercises.id),
      })
      .from(exercises);
    const totalExercises = result[0].count;

    const attempts = await db
      .select({
        count: count(userExerciseHistory.id),
      })
      .from(userExerciseHistory);
    const totalAttempts = attempts[0].count;

    const totalScores = await db
      .select({
        averageScore: avg(userExerciseHistory.score),
      })
      .from(userExerciseHistory);
    const averageScore = totalScores[0].averageScore
      ? parseFloat(totalScores[0].averageScore)
      : 0;

    const cacheData = {
      totalExercises,
      totalAttempts,
      averageScore,
    };
    await redis.set(cacheKey, JSON.stringify(cacheData), { EX: 60 * 60 * 24 });

    return res.status(200).json(GetExerciseDashboardResponseSchema.parse(cacheData));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
