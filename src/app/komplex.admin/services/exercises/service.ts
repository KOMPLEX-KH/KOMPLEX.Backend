import { avg, count, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  choices,
  exercises,
  questions,
  userExerciseHistory,
} from "@/db/schema.js";
import { sql } from "drizzle-orm";
import { redis } from "@/db/redis/redisConfig.js";

export const getAllExercises = async (grade?: string) => {
  try {
    const cacheKey = `exercises:${grade || "all"}`;
    await redis.del(cacheKey);

    const cacheData = await redis.get(cacheKey);
    if (cacheData) {
      return JSON.parse(cacheData);
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

    return result;
  } catch (error: any) {
    throw new Error(`Failed to get exercises: ${error.message}`);
  }
};

export const createExercise = async (
  userId: number,
  duration: number,
  title: string,
  description: string,
  subject: string,
  grade: string,
  exerciseQuestions: any[]
) => {
  try {
    const exercise = await db
      .insert(exercises)
      .values({
        userId,
        duration,
        title,
        description,
        subject,
        grade,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: exercises.id });

    for (let question of exerciseQuestions) {
      const result = await db
        .insert(questions)
        .values({
          title: question.title,
          questionType: question.questionType,
          section: question.section,
          imageUrl: question.imageUrl,
          exerciseId: exercise[0].id,
        })
        .returning({ id: questions.id });
      const questionId = result[0].id;
      for (let choice of question.choices) {
        await db.insert(choices).values({
          questionId,
          text: choice.choice,
          isCorrect: choice.isCorrect,
          createdAt: new Date(),
        });
      }
    }

    return { message: "Exercise created successfully" };
  } catch (error: any) {
    throw new Error(`Failed to create exercise: ${error.message}`);
  }
};

export const getExerciseDashboard = async () => {
  try {
    const cacheKey = `exercise:dashboard`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
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

    return cacheData;
  } catch (error: any) {
    throw new Error(`Failed to get exercise dashboard: ${error.message}`);
  }
};
