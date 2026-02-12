import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { forumReplyLikes } from "@/db/models/forum_reply_like.js";
import { z } from "@/config/openapi/openapi.js";

export const AdminLikeForumReplyBodySchema = z
  .object({
    id: z.string(),
  })
  .openapi("AdminLikeForumReplyBody");

export const AdminLikeForumReplyResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
  })
  .openapi("AdminLikeForumReplyResponse");

export const likeForumReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = await AdminLikeForumReplyBodySchema.parseAsync(req.body);
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

    const responseBody = AdminLikeForumReplyResponseSchema.parse({
      success: true,
      message: "Forum liked successfully",
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
