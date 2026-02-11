import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { forumCommentLikes } from "@/db/models/forum_comment_like.js";

export const likeForumComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    if (!userId) {
      throw new ResponseError("Unauthorized", 401);
    }

    const like = await db
      .insert(forumCommentLikes)
      .values({
        userId: Number(userId),
        forumCommentId: Number(id),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return res.status(200).json({ like });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
