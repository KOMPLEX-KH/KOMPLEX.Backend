import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { videoReplyLike } from "@/db/drizzle/schema.js";
import { getResponseError, ResponseError } from "@/utils/response.js";

export const unlikeVideoReply = async (
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
      .delete(videoReplyLike)
      .where(
        and(
          eq(videoReplyLike.userId, Number(userId)),
          eq(videoReplyLike.videoReplyId, Number(id))
        )
      )
      .returning();

    return res.status(200).json({
      data: {
        success: true,
        message: "Video reply unliked successfully",
        unlike,
      },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
