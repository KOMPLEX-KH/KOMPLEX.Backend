import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { forumReplyLikes } from "@/db/models/forum_reply_like.js";

export const likeForumReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.body;
    const { userId } = req.user ?? {};

    if (!userId) {
      throw new ResponseError("Unauthorized", 401);
    }

    await db.insert(forumReplyLikes).values({
      userId: Number(userId),
      forumReplyId: Number(id),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(200).json({ success: true, message: "Forum liked successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
