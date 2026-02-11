import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/index.js";
import { forumReplyLikes } from "@/db/models/forum_reply_like.js";

export const unlikeForumReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.body;
    const { userId } = req.user ?? {};

    if (!userId) {
      throw new ResponseError("Unauthorized", 401);
    }

    await db
      .delete(forumReplyLikes)
      .where(
        and(
          eq(forumReplyLikes.userId, Number(userId)),
          eq(forumReplyLikes.forumReplyId, Number(id))
        )
      )
      .returning();

    return res.status(200).json({ success: true, message: "Forum unliked successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
