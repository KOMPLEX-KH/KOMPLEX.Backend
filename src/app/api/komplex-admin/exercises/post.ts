import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { exercises, questions, choices } from "@/db/schema.js";

export const createExercise = async (req: Request, res: Response) => {
  try {
    const userId = 1;
    const { duration, title, description, subject, grade, exerciseQuestions } =
      req.body;

    if (!title || !description || !subject || !grade || !exerciseQuestions) {
      throw new ResponseError("Missing required fields", 400);
    }

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

    return res.status(201).json({ message: "Exercise created successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
