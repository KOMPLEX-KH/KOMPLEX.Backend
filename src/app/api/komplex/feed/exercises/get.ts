import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { eq, count, max, and } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  exercises,
  questions,
  userExerciseHistory,
} from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const getExercises = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { grade } = req.query;
    const userId = req.user.userId;
    const cacheKey = `exercises:${grade}`;
    let userExerciseWithProgress: any[] = [];
    const redisData = await redis.get(cacheKey);

    if (redisData) {
      const exercisesFromCache = JSON.parse(redisData);
      for (const exercise of exercisesFromCache) {
        const userProgress = await db
          .select({
            numberOfAttempts: count(userExerciseHistory.id),
            highestScore: max(userExerciseHistory.score),
          })
          .from(userExerciseHistory)
          .where(
            and(
              eq(userExerciseHistory.userId, Number(userId)),
              eq(userExerciseHistory.exerciseId, exercise.id)
            )
          );
        userExerciseWithProgress.push({
          ...exercise,
          numberOfAttempts: userProgress[0].numberOfAttempts,
          highestScore: userProgress[0].highestScore,
        });
      }
    } else {
      const allExercises = await db
        .select({
          id: exercises.id,
          title: exercises.title,
          duration: exercises.duration,
          subject: exercises.subject,
          grade: exercises.grade,
        })
        .from(exercises)
        .where(eq(exercises.grade, grade as string));

      let cacheExerciseForAGrade: any[] = [];

      for (const exercise of allExercises) {
        const numberOfQuestions = await db
          .select({
            numberOfQuestions: count(questions.id),
          })
          .from(questions)
          .where(eq(questions.exerciseId, exercise.id));

        const userProgress = await db
          .select({
            numberOfAttempts: count(userExerciseHistory.id),
            highestScore: max(userExerciseHistory.score),
          })
          .from(userExerciseHistory)
          .where(
            and(
              eq(userExerciseHistory.userId, Number(userId)),
              eq(userExerciseHistory.exerciseId, exercise.id)
            )
          );

        userExerciseWithProgress.push({
          ...exercise,
          numberOfQuestions: numberOfQuestions[0].numberOfQuestions,
          numberOfAttempts: userProgress[0].numberOfAttempts,
          highestScore: userProgress[0].highestScore,
        });
        cacheExerciseForAGrade.push({
          ...exercise,
          numberOfQuestions: numberOfQuestions[0].numberOfQuestions,
        });
      }
      await redis.set(cacheKey, JSON.stringify(cacheExerciseForAGrade), {
        EX: 60 * 60,
      });
    }

    const subjects = [
      ...new Set(userExerciseWithProgress.map((exercise) => exercise.subject)),
    ];

    let response: any = {};

    for (const subject of subjects) {
      response[subject] = userExerciseWithProgress.filter(
        (exercise) => exercise.subject === subject
      );
    }

    return res.status(200).json(response);
  } catch (error) {
    return getResponseError(res, error);
  }
};