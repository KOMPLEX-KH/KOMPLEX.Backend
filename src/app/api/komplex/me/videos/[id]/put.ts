import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import {
  videos,
  users,
  userSavedVideos,
  videoLikes,
  exercises,
  questions,
  choices,
} from "@/db/drizzle/schema.js";
import { deleteFromCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { meilisearch } from "@/config/meilisearch/meilisearchConfig.js";
import { getResponseError, ResponseError } from "@/utils/response.js";

export const updateVideo = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { title, description, videoKey, thumbnailKey, questions: questionsPayload } = req.body;

    if (!id || !title || !description) {
      throw new ResponseError("Missing required fields", 400);
    }

    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, Number(id)), eq(videos.userId, Number(userId))))
      .limit(1);

    if (!video) {
      throw new ResponseError("Video not found", 404);
    }

    const updateData: Partial<typeof videos.$inferInsert> = {
      title,
      description,
      updatedAt: new Date(),
    };

    if (videoKey) {
      try {
        if (video.videoUrlForDeletion) {
          await deleteFromCloudflare("komplex-video", video.videoUrlForDeletion);
        }
      } catch { }
      updateData.videoUrl = `${process.env.R2_VIDEO_PUBLIC_URL}/${videoKey}`;
      updateData.videoUrlForDeletion = videoKey;
    }

    if (thumbnailKey) {
      try {
        if (video.thumbnailUrlForDeletion) {
          await deleteFromCloudflare(
            "komplex-image",
            video.thumbnailUrlForDeletion
          );
        }
      } catch { }
      updateData.thumbnailUrl = `${process.env.R2_PHOTO_PUBLIC_URL}/${thumbnailKey}`;
      updateData.thumbnailUrlForDeletion = thumbnailKey;
    }

    const updatedVideo = await db
      .update(videos)
      .set(updateData)
      .where(eq(videos.id, Number(id)))
      .returning({ id: videos.id });

    const [videoRow] = await db
      .select({
        id: videos.id,
        userId: videos.userId,
        title: videos.title,
        topic: videos.topic,
        type: videos.type,
        description: videos.description,
        duration: videos.duration,
        videoUrl: videos.videoUrl,
        thumbnailUrl: videos.thumbnailUrl,
        videoUrlForDeletion: videos.videoUrlForDeletion,
        thumbnailUrlForDeletion: videos.thumbnailUrlForDeletion,
        viewCount: videos.viewCount,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        username: sql`${users.firstName} || ' ' || ${users.lastName}`,
        isSave: sql`CASE WHEN ${userSavedVideos.videoId} IS NOT NULL THEN true ELSE false END`,
        isLike: sql`CASE WHEN ${videoLikes.videoId} IS NOT NULL THEN true ELSE false END`,
        likeCount: sql`COUNT(DISTINCT ${videoLikes.id})`,
        saveCount: sql`COUNT(DISTINCT ${userSavedVideos.id})`,
      })
      .from(videos)
      .leftJoin(users, eq(videos.userId, users.id))
      .leftJoin(
        userSavedVideos,
        and(
          eq(userSavedVideos.videoId, videos.id),
          eq(userSavedVideos.userId, Number(userId))
        )
      )
      .leftJoin(
        videoLikes,
        and(
          eq(videoLikes.videoId, videos.id),
          eq(videoLikes.userId, Number(userId))
        )
      )
      .where(eq(videos.id, updatedVideo[0].id))
      .groupBy(
        videos.id,
        users.firstName,
        users.lastName,
        userSavedVideos.videoId,
        videoLikes.videoId,
        userSavedVideos.id,
        videoLikes.id
      );
    const cacheVideoKey = `video:${videoRow.id}`;
    await redis.set(cacheVideoKey, JSON.stringify(videoRow), { EX: 600 });
    const meilisearchData = {
      id: videoRow.id,
      title: videoRow.title,
      description: videoRow.description,
    };
    await meilisearch.index("videos").addDocuments([meilisearchData]);

    if (Array.isArray(questionsPayload) && questionsPayload.length > 0) {
      const [exercise] = await db
        .select()
        .from(exercises)
        .where(eq(exercises.videoId, Number(id)))
        .limit(1);

      const exerciseIdToUse = async () => {
        if (exercise) {
          await db
            .update(exercises)
            .set({ updatedAt: new Date() })
            .where(eq(exercises.id, exercise.id));
          return exercise.id;
        }
        const createdExerciseResult = await db
          .insert(exercises)
          .values({
            videoId: Number(id),
            userId: Number(userId),
            duration: 0,
            title: title ?? null,
            description: description ?? null,
            subject: null,
            grade: null as any,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        const createdExercise = (createdExerciseResult as any[])[0];
        return createdExercise.id;
      };

      const ensuredExerciseId = await exerciseIdToUse();

      for (const question of questionsPayload) {
        let questionIdToUse: number | null = null;

        if (question.id && !isNaN(Number(question.id))) {
          const [existingQuestionById] = await db
            .select()
            .from(questions)
            .where(eq(questions.id, Number(question.id)))
            .limit(1);

          if (existingQuestionById) {
            questionIdToUse = existingQuestionById.id;
            await db
              .update(questions)
              .set({ title: question.title, updatedAt: new Date() })
              .where(eq(questions.id, existingQuestionById.id));
          }
        }

        if (!questionIdToUse) {
          const [insertedQuestion] = await db
            .insert(questions)
            .values({
              exerciseId: ensuredExerciseId,
              title: question.title,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          questionIdToUse = insertedQuestion.id;
        }

        for (const choice of question.choices) {
          if (choice.id && !isNaN(Number(choice.id))) {
            const [existingChoice] = await db
              .select()
              .from(choices)
              .where(eq(choices.id, Number(choice.id)))
              .limit(1);
            if (existingChoice) {
              await db
                .update(choices)
                .set({
                  text: choice.text,
                  isCorrect: choice.isCorrect,
                  updatedAt: new Date(),
                })
                .where(eq(choices.id, existingChoice.id));
              continue;
            }
          }
          await db.insert(choices).values({
            questionId: Number(questionIdToUse),
            text: choice.text,
            isCorrect: choice.isCorrect,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        const videoExercisesRows = await db
          .select()
          .from(exercises)
          .where(eq(exercises.videoId, Number(id)))
          .leftJoin(questions, eq(exercises.id, questions.exerciseId))
          .leftJoin(choices, eq(questions.id, choices.questionId))
          .groupBy(exercises.id, questions.id, choices.id);

        const videoExerciseMap = new Map();

        for (const row of videoExercisesRows) {
          const exercise = row.exercises;
          if (!videoExerciseMap.has(exercise.id)) {
            videoExerciseMap.set(exercise.id, {
              ...exercise,
              questions: [],
            });
          }
          const exerciseObj = videoExerciseMap.get(exercise.id);

          if (row.questions?.id) {
            let question = exerciseObj.questions.find(
              (q: any) => q.id === row.questions?.id
            );
            if (!question) {
              question = { ...row.questions, choices: [] };
              exerciseObj.questions.push(question);
            }

            if (row.choices?.id) {
              question.choices.push(row.choices);
            }
          }
        }

        const videoExercises = Array.from(videoExerciseMap.values());
        const cacheExercisesKey = `video:exercises:${id}`;
        await redis.set(cacheExercisesKey, JSON.stringify(videoExercises), {
          EX: 600,
        });
      }
    }
    await redis.del(`dashboardData:${userId}`);
    const myVideoKeys: string[] = await redis.keys(
      `myVideos:${userId}:type:*:topic:*`
    );
    if (myVideoKeys.length > 0) {
      await redis.del(myVideoKeys);
    }

    return res.status(200).json({
      data: { success: true },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
