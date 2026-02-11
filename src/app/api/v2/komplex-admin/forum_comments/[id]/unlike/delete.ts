import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/index.js";
import { forumCommentLikes } from "@/db/models/forum_comment_like.js";

export const unlikeForumComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    if (!userId) {
      throw new ResponseError("Unauthorized", 401);
    }

    const unlike = await db
      .delete(forumCommentLikes)
      .where(
        and(
          eq(forumCommentLikes.userId, Number(userId)),
          eq(forumCommentLikes.forumCommentId, Number(id))
        )
      )
      .returning();

    return res.status(200).json({ unlike });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
