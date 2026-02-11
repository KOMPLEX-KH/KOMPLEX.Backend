import { Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db/index.js";
import { userVideoHistory, videos } from "@/db/schema.js";
import { AuthenticatedRequest } from "@/types/request.js";
import { ResponseError, getResponseError } from "@/utils/responseError.js";

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

    return res.status(200).json(
      videoHistory.map((history) => ({
        id: history.user_video_history.id,
        videoId: history.user_video_history.videoId,
        createdAt: history.user_video_history.createdAt,
        updatedAt: history.user_video_history.updatedAt,
        title: history.videos?.title,
        thumbnailUrl: history.videos?.thumbnailUrl,
      }))
    );
  } catch (error) {
    return getResponseError(res, error);
  }
};
