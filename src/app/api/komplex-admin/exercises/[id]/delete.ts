import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import {
  exercises,
  questions,
  choices,
  exerciseQuestionHistory,
  userExerciseHistory,
} from "@/db/drizzle/schema.js";
import { z } from "@/config/openapi/openapi.js";

export const DeleteExerciseParamsSchema = z.object({
  id: z.string(),
}).openapi("DeleteExerciseParams");

export const DeleteExerciseResponseSchema = z.object({
  message: z.string(),
}).openapi("DeleteExerciseResponse");

export const deleteExercise = async (req: Request, res: Response) => {
  try {
    const { id } = await DeleteExerciseParamsSchema.parseAsync(req.params);

    const questionIds = await db
      .select({
        id: questions.id,
      })
      .from(questions)
      .where(eq(questions.exerciseId, Number(id)));

    await db.delete(choices).where(
      inArray(
        choices.questionId,
        questionIds.map((q) => q.id)
      )
    );

    for (let questionId of questionIds) {
      await db
        .delete(exerciseQuestionHistory)
        .where(eq(exerciseQuestionHistory.questionId, questionId.id));
    }

    await db.delete(questions).where(eq(questions.exerciseId, Number(id)));
    await db
      .delete(userExerciseHistory)
      .where(eq(userExerciseHistory.exerciseId, Number(id)));
    await db.delete(exercises).where(eq(exercises.id, Number(id)));

    return res.status(200).json(DeleteExerciseResponseSchema.parse({ message: "Exercise deleted successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
