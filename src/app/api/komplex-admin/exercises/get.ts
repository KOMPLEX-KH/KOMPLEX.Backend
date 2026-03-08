import { Request, Response } from "express";
import { getResponseError } from "@/utils/response.js";
import { eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { exercises, questions, userExerciseHistory } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { z } from "@/config/openapi/openapi.js";

export const GetExercisesQuerySchema = z.object({
  grade: z.string().optional(),
}).openapi("GetExercisesQuery");

export const GetExercisesResponse = z.object({
  exercises: z.array(z.object({
    id: z.number(),
    duration: z.number(),
    title: z.string(),
    subject: z.string(),
    grade: z.string(),
    createdAt: z.string(),
    questionCount: z.number(),
    attemptCount: z.number(),
    averageScore: z.number(),
  })),
}).openapi("GetExercisesResponseSchema");

export const getExercises = async (req: Request, res: Response) => {
  try {
    const { grade } = await GetExercisesQuerySchema.parseAsync(req.query);
    const cacheKey = `exercises:${grade || "all"}`;
    await redis.del(cacheKey);

    const cacheData = await redis.get(cacheKey);
    if (cacheData) {
      return res.status(200).json(GetExercisesResponse.parse(JSON.parse(cacheData)));
    }

    const baseQuery = db
      .select({
        id: exercises.id,
        duration: exercises.duration,
        title: exercises.title,
        subject: exercises.subject,
        grade: exercises.grade,
        createdAt: exercises.createdAt,
        questionCount: sql<number>`COUNT(DISTINCT ${questions.id})`,
        attemptCount: sql<number>`COUNT(DISTINCT ${userExerciseHistory.id})`,
        averageScore: sql<number>`AVG(${userExerciseHistory.score})`,
      })
      .from(exercises)
      .leftJoin(questions, eq(exercises.id, questions.exerciseId))
      .leftJoin(
        userExerciseHistory,
        eq(exercises.id, userExerciseHistory.exerciseId)
      )
      .where(isNull(exercises.videoId));

    const result = await baseQuery.groupBy(exercises.id);
    await redis.set(cacheKey, JSON.stringify(result), { EX: 1 });

    return res.status(200).json(GetExercisesResponse.parse(result));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
