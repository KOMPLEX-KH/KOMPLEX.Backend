import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { db } from "@/db/index.js";
import { videoCommentLike } from "@/db/schema.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";

export const likeVideoComment = async (
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
      .insert(videoCommentLike)
      .values({
        userId: Number(userId),
        videoCommentId: Number(id),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return res.status(200).json({
      data: {
        success: true,
        message: "Comment liked successfully",
        like,
      },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
