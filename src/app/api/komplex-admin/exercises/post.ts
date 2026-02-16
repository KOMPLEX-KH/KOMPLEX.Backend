import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { exercises, questions, choices } from "@/db/drizzle/schema.js";
import { z } from "@/config/openapi/openapi.js";
import { AuthenticatedRequest } from "@/types/request.js";

export const CreateExerciseBodySchema = z.object({
  duration: z.number(),
  title: z.string(),
  description: z.string(),
  subject: z.string(),
  grade: z.string(),
  exerciseQuestions: z.array(z.object({
    title: z.string(),
    questionType: z.string(),
    section: z.string(),
    imageUrl: z.string(),
    choices: z.array(z.object({
      text: z.string(),
      isCorrect: z.boolean(),
    })),
  })),
}).openapi("CreateExerciseBody");

export const CreateExerciseResponseSchema = z.object({
  message: z.string(),
}).openapi("CreateExerciseResponse");

export const createExercise = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const { duration, title, description, subject, grade, exerciseQuestions } =
      await CreateExerciseBodySchema.parseAsync(req.body);

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
          text: choice.text,
          isCorrect: choice.isCorrect,
          createdAt: new Date(),
        });
      }
    }

    return res.status(201).json(CreateExerciseResponseSchema.parse({ message: "Exercise created successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
