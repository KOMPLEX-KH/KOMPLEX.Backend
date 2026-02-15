import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { db } from "@/db/drizzle/index.js";
import { forumCommentLikes } from "@/db/drizzle/schema.js";
import { getResponseError } from "@/utils/response.js";

export const likeForumComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const like = await db
      .insert(forumCommentLikes)
      .values({
        userId: Number(userId),
        forumCommentId: Number(id),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return res.status(200).json({
      data: {
        success: true,
        message: "Forum comment liked successfully",
        like,
      },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
