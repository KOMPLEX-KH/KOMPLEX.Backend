import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { forumReplies } from "@/db/schema.js";
import { forumReplyMedias } from "@/db/models/forum_reply_media.js";

export const postForumReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user ?? {};
    const { description, forumCommentId } = req.body;

    if (!userId || !forumCommentId || !description) {
      throw new ResponseError("Missing required fields", 400);
    }

    const insertedForumReply = await db
      .insert(forumReplies)
      .values({
        userId: Number(userId),
        forumCommentId: Number(forumCommentId),
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return res.status(201).json({
      forum: insertedForumReply[0],
    });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
