import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { eq, inArray } from "drizzle-orm";
import { exercises, questions, choices } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const getExerciseById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const cacheKey = `exercise:${id}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const exerciseResult = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, parseInt(id)))
      .limit(1);

    if (!exerciseResult || exerciseResult.length === 0) {
      throw new ResponseError("Exercise not found", 404);
    }

    const exercise = exerciseResult[0];

    const questionsResult = await db
      .select()
      .from(questions)
      .where(eq(questions.exerciseId, parseInt(id)));

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

    for (const question of exerciseWithQuestions.questions) {
      const randomizedChoices = question.choices.sort(
        () => Math.random() - 0.5
      );
      question.choices = randomizedChoices;
    }

    await redis.set(cacheKey, JSON.stringify(exerciseWithQuestions), {
      EX: 600,
    });

    return res.status(200).json({
      ...exerciseWithQuestions,
      questions: exerciseWithQuestions.questions.reverse(),
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};