import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { forumReplies } from "@/db/schema.js";
import { forumReplyMedias } from "@/db/models/forum_reply_media.js";
import { z } from "@/config/openapi/openapi.js";

export const AdminPostForumReplyBodySchema = z
  .object({
    description: z.string(),
    forumCommentId: z.string(),
  })
  .openapi("AdminPostForumReplyBody");

export const AdminPostForumReplyResponseSchema = z
  .object({
    forum: z.any(),
  })
  .openapi("AdminPostForumReplyResponse");

export const postForumReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user ?? {};
    const { description, forumCommentId } =
      await AdminPostForumReplyBodySchema.parseAsync(req.body);

    if (!userId) {
      throw new ResponseError("Missing required user", 400);
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

    const responseBody = AdminPostForumReplyResponseSchema.parse({
      forum: insertedForumReply[0],
    });

    return res.status(201).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
