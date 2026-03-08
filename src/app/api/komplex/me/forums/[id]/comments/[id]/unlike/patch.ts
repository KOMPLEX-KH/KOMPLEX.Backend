import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { forumCommentLikes } from "@/db/drizzle/schema.js";
import { getResponseError } from "@/utils/response.js";

export const unlikeForumComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const unlike = await db
      .delete(forumCommentLikes)
      .where(
        and(
          eq(forumCommentLikes.userId, Number(userId)),
          eq(forumCommentLikes.forumCommentId, Number(id))
        )
      )
      .returning();

    return res.status(200).json({
      data: {
        success: true,
        message: "Forum comment unliked successfully",
        unlike,
      },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
