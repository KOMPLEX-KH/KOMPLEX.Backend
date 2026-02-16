import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { videoCommentLike } from "@/db/drizzle/schema.js";
import { getResponseError, ResponseError } from "@/utils/response.js";

export const unlikeVideoComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!userId) {
      throw new ResponseError("Unauthorized", 401);
    }

    const unlike = await db
      .delete(videoCommentLike)
      .where(
        and(
          eq(videoCommentLike.userId, Number(userId)),
          eq(videoCommentLike.videoCommentId, Number(id))
        )
      )
      .returning();

    return res.status(200).json({
      data: {
        success: true,
        message: "Comment unliked successfully",
        unlike,
      },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
