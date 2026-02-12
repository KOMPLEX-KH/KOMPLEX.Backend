import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import {
  videos,
  videoComments,
  videoLikes,
  userSavedVideos,
  exercises,
  questions,
  choices,
  userVideoHistory,
} from "@/db/schema.js";
import { deleteFromCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { meilisearch } from "@/config/meilisearch/meilisearchConfig.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { deleteVideoCommentInternal } from "./comments/[id]/delete.js";

export const deleteVideo = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const [doesThisUserOwnThisVideo] = await db
      .select({
        videoUrlForDeletion: videos.videoUrlForDeletion,
        thumbnailUrlForDeletion: videos.thumbnailUrlForDeletion,
      })
      .from(videos)
      .where(and(eq(videos.id, Number(id)), eq(videos.userId, Number(userId))));

    if (!doesThisUserOwnThisVideo) {
      throw new ResponseError("Video not found or unauthorized", 404);
    }

    const [doesThisVideoHasComments] = await db
      .select()
      .from(videoComments)
      .where(eq(videoComments.videoId, Number(id)))
      .limit(1);

    let deleteComments = null;
    if (doesThisVideoHasComments) {
      deleteComments = await deleteVideoCommentInternal(
        Number(userId),
        null,
        Number(id)
      );
    }

    const deletedLikes = await db
      .delete(videoLikes)
      .where(eq(videoLikes.videoId, Number(id)))
      .returning();

    const deletedSaves = await db
      .delete(userSavedVideos)
      .where(eq(userSavedVideos.videoId, Number(id)))
      .returning();

    const exerciseId = await db
      .select()
      .from(exercises)
      .where(eq(exercises.videoId, Number(id)));
    if (exerciseId && exerciseId.length > 0) {
      const questionIds = await db
        .select()
        .from(questions)
        .where(eq(questions.exerciseId, Number(exerciseId[0].id)));

      for (const questionId of questionIds) {
        await db
          .delete(choices)
          .where(eq(choices.questionId, Number(questionId.id)))
          .returning();
      }

      await db
        .delete(questions)
        .where(eq(questions.exerciseId, Number(exerciseId[0].id)))
        .returning();

      await db
        .delete(exercises)
        .where(eq(exercises.videoId, Number(id)))
        .returning();
    }

    if (doesThisUserOwnThisVideo.videoUrlForDeletion) {
      try {
        await deleteFromCloudflare(
          "komplex-video",
          doesThisUserOwnThisVideo.videoUrlForDeletion
        );
      } catch (err) {
        console.error("Failed to delete video from Cloudflare:", err);
      }
    }

    if (doesThisUserOwnThisVideo.thumbnailUrlForDeletion) {
      try {
        await deleteFromCloudflare(
          "komplex-image",
          doesThisUserOwnThisVideo.thumbnailUrlForDeletion
        );
      } catch (err) {
        console.error("Failed to delete thumbnail from Cloudflare:", err);
      }
    }

    await db
      .delete(userVideoHistory)
      .where(eq(userVideoHistory.videoId, Number(id)));

    const deletedVideo = await db
      .delete(videos)
      .where(and(eq(videos.id, Number(id)), eq(videos.userId, Number(userId))))
      .returning();
    await redis.del(`videos:${id}`);
    const myVideoKeys: string[] = await redis.keys(
      `myVideos:${userId}:type:*:topic:*`
    );

    if (myVideoKeys.length > 0) {
      await redis.del(myVideoKeys);
    }
    await redis.del(`dashboardData:${userId}`);

    await meilisearch.index("videos").deleteDocument(String(id));

    return res.status(200).json({
      data: deletedVideo,
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
