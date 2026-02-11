import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { videoComments, videoReplies } from "@/db/schema.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { deleteVideoCommentInternal } from "@/app/api/v1/komplex/services/me/video-comments/[id]/service.js";
import { deleteVideoReplyInternal } from "@/app/api/v1/komplex/services/me/video-replies/[id]/service.js";

export const deleteVideoComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const doesUserOwnThisComment = await db
      .select()
      .from(videoComments)
      .where(
        and(
          eq(videoComments.id, Number(id)),
          eq(videoComments.userId, Number(userId))
        )
      )
      .limit(1);

    if (doesUserOwnThisComment.length === 0) {
      throw new ResponseError("Comment not found", 404);
    }

    const doesThisCommentHasReply = await db
      .select()
      .from(videoReplies)
      .where(eq(videoReplies.videoCommentId, Number(id)));
    let replyResults = null;
    if (doesThisCommentHasReply.length > 0) {
      replyResults = await deleteVideoReplyInternal(
        Number(userId),
        null,
        Number(id)
      );
    }
    const commentResults = await deleteVideoCommentInternal(
      Number(userId),
      Number(id),
      null
    );

    return res.status(200).json({
      data: {
        success: true,
        message: "Comment deleted successfully",
        commentResults,
      },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};

export const deleteComment = async (
  userId: number,
  commentId: number | null,
  videoId: number | null
) => {
  return await deleteVideoCommentInternal(userId, commentId, videoId);
};
