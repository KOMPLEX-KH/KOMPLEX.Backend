import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import {
  videos,
  videoComments,
  videoLikes,
  userSavedVideos,
  exercises,
  questions,
  choices,
  userVideoHistory,
} from "@/db/drizzle/schema.js";
import { deleteFromCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { meilisearch } from "@/config/meilisearch/meilisearchConfig.js";
import { sendResponseError, ResponseError } from "@/utils/response.js";
import { deleteVideoCommentInternal } from "./comments/[id]/delete.js";
import { z } from "@/config/openapi/openapi.js";

export const MeDeleteVideoParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("MeDeleteVideoParams");

export const MeDeleteVideoResponseSchema = z
  .object({
    data: z.array(z.any()),
  })
  .openapi("MeDeleteVideoResponse");

export const deleteVideo = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = await MeDeleteVideoParamsSchema.parseAsync(req.params);

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

    let deleteComments = null;
    const deletedVideo = await db.transaction(async (tx) => {
      if (doesThisVideoHasComments) {
        deleteComments = await deleteVideoCommentInternal(
          Number(userId),
          null,
          Number(id),
          tx as unknown as typeof db
        );
      }

      await tx
        .delete(videoLikes)
        .where(eq(videoLikes.videoId, Number(id)))
        .returning();

      await tx
        .delete(userSavedVideos)
        .where(eq(userSavedVideos.videoId, Number(id)))
        .returning();

      const exerciseId = await tx
        .select()
        .from(exercises)
        .where(eq(exercises.videoId, Number(id)));
      if (exerciseId && exerciseId.length > 0) {
        const questionIds = await tx
          .select()
          .from(questions)
          .where(eq(questions.exerciseId, Number(exerciseId[0].id)));

        for (const questionId of questionIds) {
          await tx
            .delete(choices)
            .where(eq(choices.questionId, Number(questionId.id)))
            .returning();
        }

        await tx
          .delete(questions)
          .where(eq(questions.exerciseId, Number(exerciseId[0].id)))
          .returning();

        await tx
          .delete(exercises)
          .where(eq(exercises.videoId, Number(id)))
          .returning();
      }

      await tx
        .delete(userVideoHistory)
        .where(eq(userVideoHistory.videoId, Number(id)));

      const deleted = await tx
        .delete(videos)
        .where(and(eq(videos.id, Number(id)), eq(videos.userId, Number(userId))))
        .returning();
      return deleted;
    });
    await redis.del(`videos:${id}`);
    const myVideoKeys: string[] = await redis.keys(
      `myVideos:${userId}:type:*:topic:*`
    );

    if (myVideoKeys.length > 0) {
      await redis.del(myVideoKeys);
    }
    await redis.del(`dashboardData:${userId}`);

    await meilisearch.index("videos").deleteDocument(String(id));

    const responseBody = MeDeleteVideoResponseSchema.parse({
      data: deletedVideo,
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return sendResponseError(res, error);
  }
};
