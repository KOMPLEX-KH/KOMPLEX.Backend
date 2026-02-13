import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { exercises, questions, choices } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";
import { z } from "@/config/openapi/openapi.js";

export const UpdateExerciseParamsSchema = z.object({
  id: z.string(),
}).openapi("UpdateExerciseParams");

export const UpdateExerciseBodySchema = z.object({
  duration: z.number(),
  title: z.string(),
  description: z.string(),
  subject: z.string(),
  grade: z.string(),
  exerciseQuestions: z.array(z.object({
    id: z.string(),
    title: z.string(),
    questionType: z.string(),
    section: z.string(),
    imageUrl: z.string(),
    choices: z.array(z.object({
      id: z.string(),
      text: z.string(),
      isCorrect: z.boolean(),
    })),
  })),
}).openapi("UpdateExerciseBody");

export const UpdateExerciseResponseSchema = z.object({
  message: z.string(),
}).openapi("UpdateExerciseResponse");

export const updateExercise = async (req: Request, res: Response) => {
  try {
    const { id } = await UpdateExerciseParamsSchema.parseAsync(req.params);
    const { duration, title, description, subject, grade, exerciseQuestions } =
      await UpdateExerciseBodySchema.parseAsync(req.body);

    const cacheKey = `exercise:${id}`;

    await db
      .update(exercises)
      .set({ duration, title, description, subject, grade, updatedAt: new Date() })
      .where(eq(exercises.id, Number(id)));

    if (exerciseQuestions) {
      for (let question of exerciseQuestions) {
        await db
          .update(questions)
          .set({
            title: question.title,
            questionType: question.questionType,
            section: question.section,
            imageUrl: question.imageUrl,
          })
          .where(eq(questions.id, parseInt(question.id)));

        if (question.choices) {
          for (let choice of question.choices) {
            await db
              .update(choices)
              .set({
                text: choice.text,
                isCorrect: choice.isCorrect,
              })
              .where(eq(choices.id, parseInt(choice.id)));
          }
        }
      }
    }

    await redis.del(cacheKey);
    return res.status(200).json(UpdateExerciseResponseSchema.parse({ message: "Exercise updated successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
