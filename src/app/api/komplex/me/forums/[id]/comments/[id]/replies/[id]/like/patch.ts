import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { db } from "@/db/index.js";
import { forumReplyLikes } from "@/db/schema.js";
import { getResponseError } from "@/utils/responseError.js";

export const likeForumReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const like = await db
      .insert(forumReplyLikes)
      .values({
        userId: Number(userId),
        forumReplyId: Number(id),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return res.status(200).json({
      data: {
        success: true,
        message: "Forum reply liked successfully",
        like,
      },
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
