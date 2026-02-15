import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import {
  videos,
  users,
  exercises,
  questions as questionsTable,
  choices,
} from "@/db/drizzle/schema.js";
import { meilisearch } from "@/config/meilisearch/meilisearchConfig.js";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

export const MePostVideoQuestionChoiceSchema = z.object({
  text: z.string(),
  isCorrect: z.boolean(),
});

export const MePostVideoQuestionSchema = z.object({
  title: z.string(),
  choices: z.array(MePostVideoQuestionChoiceSchema),
});

export const MePostVideoBodySchema = z
  .object({
    videoKey: z.string(),
    title: z.string(),
    description: z.string(),
    topic: z.string().optional(),
    type: z.string().optional(),
    thumbnailKey: z.string(),
    duration: z.number().optional(),
    questions: z.array(MePostVideoQuestionSchema).optional(),
  })
  .openapi("MePostVideoBody");

export const MePostVideoResponseSchema = z
  .object({
    data: z.array(z.any()),
  })
  .openapi("MePostVideoResponse");

export const postVideo = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const {
      videoKey,
      title,
      description,
      topic,
      type,
      thumbnailKey,
      duration,
      questions,
    } = await MePostVideoBodySchema.parseAsync(req.body);

    if (!userId) {
      throw new ResponseError("Missing required user", 400);
    }

    const videoUrl = `${process.env.R2_VIDEO_PUBLIC_URL}/${videoKey}`;
    const thumbnailUrl = `${process.env.R2_PHOTO_PUBLIC_URL}/${thumbnailKey}`;

    const newVideoResult = await db
      .insert(videos)
      .values({
        videoUrlForDeletion: videoKey,
        videoUrl,
        thumbnailUrlForDeletion: thumbnailKey,
        thumbnailUrl,
        title,
        description,
        topic,
        type,
        viewCount: 0,
        duration: duration || 0,
        userId: Number(userId),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    const newVideo = newVideoResult as any[];
    const [username] = await db
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, Number(userId)));
    const videoWithMedia = {
      id: newVideo[0].id,
      userId: newVideo[0].userId,
      title: newVideo[0].title,
      description: newVideo[0].description,
      type: newVideo[0].type,
      topic: newVideo[0].topic,
      viewCount: newVideo[0].viewCount,
      createdAt: newVideo[0].createdAt,
      updatedAt: newVideo[0].updatedAt,
      username: username.firstName + " " + username.lastName,
      videoUrl: newVideo[0].videoUrl,
      thumbnailUrl: newVideo[0].thumbnailUrl,
    };
    const redisKey = `videos:${newVideo[0].id}`;

    const meilisearchData = {
      id: videoWithMedia.id,
      title: videoWithMedia.title,
      description: videoWithMedia.description,
    };
    await meilisearch.index("videos").addDocuments([meilisearchData]);

    if (questions && questions.length > 0) {
      const newExerciseResult = await db
        .insert(exercises)
        .values({
          videoId: newVideo[0].id,
          title: `Quiz for ${title}`,
          description: `Multiple choice questions for the video: ${title}`,
          subject: topic || "General",
          grade: "All",
          duration: 0,
          userId: Number(userId),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      const newExercise = newExerciseResult as any[];

      let exercise = {
        title: `Quiz for ${title}`,
        description: `Multiple choice questions for the video: ${title}`,
        subject: topic || "General",
        grade: "All",
      } as {
        title: string;
        description: string;
        subject: string;
        grade: string;
        questions: {
          title: string | null;
          questionType: string | null;
          section: string | null;
          imageUrl: string | null;
          choices?: { text: string; isCorrect: boolean }[];
        }[];
      };

      let questionsForExercise: {
        title: string | null;
        questionType: string | null;
        section: string | null;
        imageUrl: string | null;
        choices: { text: string; isCorrect: boolean }[];
      }[] = [];

      for (const question of questions) {
        const newQuestionResult = await db
          .insert(questionsTable)
          .values({
            exerciseId: newExercise[0].id,
            title: question.title,
            questionType: "",
            section: "",
            imageUrl: "",
            userId: Number(userId),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        const newQuestion = newQuestionResult as any[];

        let questionToAdd = {
          title: newQuestion[0].title,
          questionType: newQuestion[0].questionType,
          section: newQuestion[0].section,
          imageUrl: newQuestion[0].imageUrl,
        } as {
          title: string | null;
          questionType: string | null;
          section: string | null;
          imageUrl: string | null;
          choices: { text: string; isCorrect: boolean }[];
        };

        let choicesForQuestion: { text: string; isCorrect: boolean }[] = [];
        for (const choice of question.choices) {
          await db.insert(choices).values({
            questionId: newQuestion[0].id,
            text: choice.text,
            isCorrect: choice.isCorrect,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          choicesForQuestion.push({
            text: choice.text,
            isCorrect: choice.isCorrect,
          });
        }
        questionToAdd = { ...questionToAdd, choices: choicesForQuestion };
        questionsForExercise.push(questionToAdd);
      }
      exercise = { ...exercise, questions: questionsForExercise };
      const cacheKey = `exercises:videoId:${newVideo[0].id}`;
      await redis.set(cacheKey, JSON.stringify(exercise), { EX: 600 });
    }
    await redis.del(`dashboardData:${userId}`);
    const myVideoKeys: string[] = await redis.keys(
      `myVideos:${userId}:type:*:topic:*:page:*`
    );

    if (myVideoKeys.length > 0) {
      await redis.del(myVideoKeys);
    }

    const responseBody = MePostVideoResponseSchema.parse({
      data: newVideo,
    });

    return res.status(201).json(responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};
