import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { videoReplies } from "@/db/schema.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { deleteVideoReplyInternal } from "@/app/api/v1/komplex/services/me/video-replies/[id]/service.js";

export const deleteVideoReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const [doesUserOwnThisReply] = await db
      .select()
      .from(videoReplies)
      .where(
        and(
          eq(videoReplies.id, Number(id)),
          eq(videoReplies.userId, Number(userId))
        )
      )
      .limit(1);

    if (!doesUserOwnThisReply) {
      throw new ResponseError("Video reply not found", 404);
    }

    const result = await deleteVideoReplyInternal(
      Number(userId),
      Number(id),
      null
    );

    return res.status(200).json({
      data: {
        success: true,
        message: "Video reply deleted successfully",
        ...result,
      },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};

export const deleteReply = async (
  userId: number,
  videoReplyId: number | null,
  commentId: number | null
) => {
  return await deleteVideoReplyInternal(userId, videoReplyId, commentId);
};
