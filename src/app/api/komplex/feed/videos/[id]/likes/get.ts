import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { db } from "@/db/drizzle/index.js";
import { users, videoLikes } from "@/db/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { getResponseError } from "@/utils/response.js";

export const getVideoLikes = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const likesOfVideo = await db
      .select()
      .from(videoLikes)
      .leftJoin(users, eq(videoLikes.userId, users.id))
      .where(eq(videoLikes.videoId, Number(id)));

    const data = likesOfVideo.map((like) => ({
      id: like.video_likes.id,
      userId: like.video_likes.userId,
      videoId: like.video_likes.videoId,
      username: like.users?.firstName + " " + like.users?.lastName,
      profileImage: like.users?.profileImage,
      createdAt: like.video_likes.createdAt,
      updatedAt: like.video_likes.updatedAt,
    }));

    return res.status(200).json({ data });
  } catch (error) {
    return getResponseError(res, error);
  }
};
