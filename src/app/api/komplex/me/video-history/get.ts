import { Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db/index.js";
import { userVideoHistory, videos } from "@/db/schema.js";
import { AuthenticatedRequest } from "@/types/request.js";
import { ResponseError, getResponseError } from "@/utils/responseError.js";
import { z } from "@/config/openapi/openapi.js";

const VideoHistoryItemSchema = z.object({
  id: z.number(),
  videoId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  title: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
});

export const MeVideoHistoryResponseSchema = z
  .object({
    data: z.array(VideoHistoryItemSchema),
  })
  .openapi("MeVideoHistoryResponse");

export const getMyVideoHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;

    const videoHistory = await db
      .select()
      .from(userVideoHistory)
      .leftJoin(videos, eq(userVideoHistory.videoId, videos.id))
      .where(eq(userVideoHistory.userId, Number(userId)))
      .orderBy(desc(userVideoHistory.createdAt));

    const mapped = videoHistory.map((history) => ({
      id: history.user_video_history.id,
      videoId: history.user_video_history.videoId,
      createdAt: history.user_video_history.createdAt,
      updatedAt: history.user_video_history.updatedAt,
      title: history.videos?.title,
      thumbnailUrl: history.videos?.thumbnailUrl,
    }));

    const responseBody = MeVideoHistoryResponseSchema.parse({ data: mapped });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error);
  }
};
