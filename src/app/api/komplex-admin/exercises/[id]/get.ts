import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/index.js";
import { exercises, questions, choices } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";
import { z } from "@/config/openapi/openapi.js";

export const GetExerciseParamsSchema = z.object({
  id: z.string(),
}).openapi("GetExerciseParams");

export const GetExerciseResponseSchema = z.object({
  exercise: z.object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    subject: z.string(),
    grade: z.string(),
    duration: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  questions: z.array(z.object({
    id: z.number(),
    title: z.string(),
    imageUrl: z.string(),
    section: z.string(),
    choices: z.array(z.object({
      id: z.number(),
      text: z.string(),
      isCorrect: z.boolean(),
    })),
  })),
}).openapi("GetExerciseResponse");

export const getExercise = async (req: Request, res: Response) => {
  try {
    const { id } = await GetExerciseParamsSchema.parseAsync(req.params);
    const cacheKey = `exercise:${id}`;
    const cacheData = await redis.get(cacheKey);
    if (cacheData) {
      return res.status(200).json(GetExerciseResponseSchema.parse(JSON.parse(cacheData)));
    }

    const exerciseResult = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, Number(id)))
      .limit(1);

    if (!exerciseResult || exerciseResult.length === 0) {
      throw new ResponseError("Exercise not found", 404);
    }

    const exercise = exerciseResult[0];

    const questionsResult = await db
      .select()
      .from(questions)
      .where(eq(questions.exerciseId, Number(id)));

    const questionIds = questionsResult.map((q) => q.id);

    let allChoices: any[] = [];
    if (questionIds.length > 0) {
      allChoices = await db
        .select()
        .from(choices)
        .where(inArray(choices.questionId, questionIds));
    }

    const exerciseWithQuestions = {
      id: exercise.id,
      title: exercise.title,
      description: exercise.description,
      subject: exercise.subject,
      grade: exercise.grade,
      duration: exercise.duration,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
      questions: questionsResult.map((question) => ({
        id: question.id,
        title: question.title,
        imageUrl: question.imageUrl,
        section: question.section,
        choices: allChoices
          .filter((choice) => choice.questionId === question.id)
          .map((choice) => ({
            id: choice.id,
            text: choice.text,
            isCorrect: choice.isCorrect,
          })),
      })),
    };

    await redis.set(cacheKey, JSON.stringify(exerciseWithQuestions), {
      EX: 60 * 60 * 24,
    });

    return res.status(200).json(GetExerciseResponseSchema.parse(exerciseWithQuestions));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
