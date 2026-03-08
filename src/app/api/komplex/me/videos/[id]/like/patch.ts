import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { db } from "@/db/drizzle/index.js";
import { videoLikes } from "@/db/drizzle/schema.js";
import { getResponseError, ResponseError } from "@/utils/response.js";

export const likeVideo = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!userId) {
      throw new ResponseError("Unauthorized", 401);
    }

    const like = await db
      .insert(videoLikes)
      .values({
        userId: Number(userId),
        videoId: Number(id),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return res.status(200).json({ data: { like } });
  } catch (error) {
    return getResponseError(res, error);
  }
};
