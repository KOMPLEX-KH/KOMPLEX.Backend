import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  exercises,
  questions,
  choices,
  exerciseQuestionHistory,
  userExerciseHistory,
} from "@/db/schema.js";

export const deleteExercise = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

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

    return res.status(200).json({ message: "Exercise deleted successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
