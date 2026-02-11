import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  choices,
  exerciseQuestionHistory,
  exercises,
  questions,
  userExerciseHistory,
} from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const getExercise = async (id: number) => {
  try {
    const cacheKey = `exercise:${id}`;
    const cacheData = await redis.get(cacheKey);
    if (cacheData) {
      return JSON.parse(cacheData);
    }

    const exerciseResult = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, id))
      .limit(1);

    if (!exerciseResult || exerciseResult.length === 0) {
      throw new Error("Exercise not found");
    }

    const exercise = exerciseResult[0];

    const questionsResult = await db
      .select()
      .from(questions)
      .where(eq(questions.exerciseId, id));

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

    return exerciseWithQuestions;
  } catch (error: any) {
    throw new Error(`Failed to get exercise: ${error.message}`);
  }
};

export const updateExercise = async (
  id: number,
  duration: number,
  title: string,
  description: string,
  subject: string,
  grade: string,
  exerciseQuestions: any[]
) => {
  try {
    const cacheKey = `exercise:${id}`;

    await db
      .update(exercises)
      .set({ duration, title, description, subject, grade })
      .where(eq(exercises.id, id));

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

    await redis.del(cacheKey);
    return { message: "Exercise updated successfully" };
  } catch (error: any) {
    throw new Error(`Failed to update exercise: ${error.message}`);
  }
};

export const deleteExercise = async (id: number) => {
  try {
    const questionIds = await db
      .select({
        id: questions.id,
      })
      .from(questions)
      .where(eq(questions.exerciseId, id));

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

    await db.delete(questions).where(eq(questions.exerciseId, id));
    await db
      .delete(userExerciseHistory)
      .where(eq(userExerciseHistory.exerciseId, id));
    await db.delete(exercises).where(eq(exercises.id, id));

    return { message: "Exercise deleted successfully" };
  } catch (error: any) {
    throw new Error(`Failed to delete exercise: ${error.message}`);
  }
};
