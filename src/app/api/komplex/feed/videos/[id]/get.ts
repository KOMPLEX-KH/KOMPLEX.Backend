import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import {
  videos,
  users,
  userSavedVideos,
  videoLikes,
  userVideoHistory,
  exercises,
  questions,
  choices,
  followers,
} from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { getResponseError, getResponseSuccess, ResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";
import { FeedVideoItemSchema } from "../../videos/get.js";

// const VideoByIdResponseSchema = z.object({
//   ...FeedVideoItemSchema,
//   exercises: z.array(ExerciseSchema),
//   isFollowing: z.boolean(),
// }).openapi("VideoByIdResponseSchema");

const VideoByIdParamsSchema = z.object({
  id: z.number(),
}).openapi("GetVideoByIdParamsSchema");

export const getVideoById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = await VideoByIdParamsSchema.parseAsync(req.params);
    const videoId = Number(id);


    const cacheVideoKey = `video:${videoId}`;
    const cacheExercisesKey = `exercises:videoId:${videoId}`;

    const cacheVideoData = await redis.get(cacheVideoKey);
    const cacheExercisesData = await redis.get(cacheExercisesKey);
    if (cacheVideoData && cacheExercisesData) {
      let video = JSON.parse(cacheVideoData);
      const exercises = JSON.parse(cacheExercisesData);

      if (!video.userId) {
        const [fullVideo] = await db
          .select({
            id: videos.id,
            userId: videos.userId,
            title: videos.title,
            description: videos.description,
            type: videos.type,
            topic: videos.topic,
            duration: videos.duration,
            videoUrl: videos.videoUrl,
            thumbnailUrl: videos.thumbnailUrl,
            videoUrlForDeletion: videos.videoUrlForDeletion,
            thumbnailUrlForDeletion: videos.thumbnailUrlForDeletion,
            viewCount: videos.viewCount,
            createdAt: videos.createdAt,
            updatedAt: videos.updatedAt,
            username: sql`${users.firstName} || ' ' || ${users.lastName}`,
            profileImage: users.profileImage,
          })
          .from(videos)
          .leftJoin(users, eq(videos.userId, users.id))
          .where(eq(videos.id, videoId));

        if (fullVideo) {
          video = { ...video, ...fullVideo };
        }
      }

      const isFollowing = await db
        .select()
        .from(followers)
        .where(
          and(
            eq(followers.followedId, Number(video.userId)),
            eq(followers.userId, Number(userId))
          )
        );
      const realTimeData = await db
        .select({
          viewCount: videos.viewCount,
          likeCount: sql`COUNT(DISTINCT ${videoLikes.id})`,
          saveCount: sql`COUNT(DISTINCT ${userSavedVideos.id})`,
          isLiked: sql`CASE WHEN ${videoLikes.videoId} IS NOT NULL THEN true ELSE false END`,
          isSaved: sql`CASE WHEN ${userSavedVideos.videoId} IS NOT NULL THEN true ELSE false END`,
        })
        .from(videos)
        .leftJoin(
          videoLikes,
          and(
            eq(videoLikes.videoId, videos.id),
            eq(videoLikes.userId, Number(userId))
          )
        )
        .leftJoin(
          userSavedVideos,
          and(
            eq(userSavedVideos.videoId, videos.id),
            eq(userSavedVideos.userId, Number(userId))
          )
        )
        .where(eq(videos.id, videoId))
        .groupBy(
          videos.id,
          videos.viewCount,
          videoLikes.videoId,
          userSavedVideos.videoId
        );
      video = {
        ...video,
        ...realTimeData[0],
        viewCount: Number(realTimeData[0].viewCount),
        likeCount: Number(realTimeData[0].likeCount),
        saveCount: Number(realTimeData[0].saveCount),
        isLiked: !!realTimeData[0].isLiked,
        isSaved: !!realTimeData[0].isSaved,
      };
      await db
        .update(videos)
        .set({ viewCount: video.viewCount })
        .where(eq(videos.id, videoId));

      if (userId !== 0) {
        const [updatedUser] = await db
          .update(users)
          .set({ lastVideoId: videoId })
          .where(eq(users.id, userId))
          .returning();
        if (!updatedUser) {
          throw new ResponseError("Failed to update user last video", 500);
        }
      }
      await db.insert(userVideoHistory).values({
        userId: Number(userId),
        videoId: videoId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return getResponseSuccess(res, FeedVideoItemSchema.parse({ ...video, exercises, isFollowing: isFollowing.length > 0 }), "Video fetched successfully");
    }

    const [videoRow] = await db
      .select({
        id: videos.id,
        userId: videos.userId,
        title: videos.title,
        description: videos.description,
        type: videos.type,
        topic: videos.topic,
        duration: videos.duration,
        videoUrl: videos.videoUrl,
        thumbnailUrl: videos.thumbnailUrl,
        videoUrlForDeletion: videos.videoUrlForDeletion,
        thumbnailUrlForDeletion: videos.thumbnailUrlForDeletion,
        viewCount: videos.viewCount,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        username: sql`${users.firstName} || ' ' || ${users.lastName}`,
        profileImage: users.profileImage,
        isSaved: sql`CASE WHEN ${userSavedVideos.videoId} IS NOT NULL THEN true ELSE false END`,
        isLiked: sql`CASE WHEN ${videoLikes.videoId} IS NOT NULL THEN true ELSE false END`,
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
      .where(eq(videos.id, videoId))
      .groupBy(
        videos.id,
        videos.userId,
        videos.title,
        videos.description,
        videos.duration,
        videos.videoUrl,
        videos.thumbnailUrl,
        videos.videoUrlForDeletion,
        videos.thumbnailUrlForDeletion,
        videos.viewCount,
        videos.createdAt,
        videos.updatedAt,
        sql`${users.firstName} || ' ' || ${users.lastName}`,
        users.profileImage,
        sql`CASE WHEN ${userSavedVideos.videoId} IS NOT NULL THEN true ELSE false END`,
        sql`CASE WHEN ${videoLikes.videoId} IS NOT NULL THEN true ELSE false END`
      );
    const { likeCount, saveCount, isLiked, isSaved, viewCount } = videoRow;
    await redis.set(
      cacheVideoKey,
      JSON.stringify({
        ...videoRow, // Store the full video data, not just dynamic fields
        likeCount,
        saveCount,
        isLiked,
        isSaved,
        viewCount,
      }),
      { EX: 600 }
    );

    if (!videoRow) {
      throw new ResponseError("Video not found", 404);
    }

    // get video exercises
    const videoExercisesRows = await db
      .select()
      .from(exercises)
      .where(eq(exercises.videoId, videoId))
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

    // Always increment view count on every request
    await db
      .update(videos)
      .set({
        viewCount: sql`${videos.viewCount} + 1`,
      })
      .where(eq(videos.id, videoId));

    // insert into history
    await db.insert(userVideoHistory).values({
      userId: Number(userId),
      videoId: videoId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await redis.set(cacheExercisesKey, JSON.stringify(videoExercises), {
      EX: 600,
    });
    const isFollowing = await db
      .select()
      .from(followers)
      .where(
        and(
          eq(followers.followedId, Number(videoRow.userId)),
          eq(followers.userId, userId)
        )
      );

    const videoWithExercises = {
      ...videoRow,
      exercises: videoExercises,
      isFollowing: isFollowing.length > 0,
      viewCount: Number(videoRow.viewCount), // Convert to number
      likeCount: Number(videoRow.likeCount), // Convert to number
      saveCount: Number(videoRow.saveCount), // Convert to number
    };

    if (userId !== 0) {
      const [updatedUser] = await db
        .update(users)
        .set({ lastVideoId: videoId })
        .where(eq(users.id, userId))
        .returning();
      if (!updatedUser) {
        throw new ResponseError("Failed to update user last video", 500);
      }
    }

    return res.status(200).json({ data: videoWithExercises });
  } catch (error) {
    return getResponseError(res, error);
  }
};


