import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { forumReplyLikes } from "@/db/drizzle/models/forum_reply_like.js";
import { z } from "@/config/openapi/openapi.js";

export const AdminUnlikeForumReplyBodySchema = z
  .object({
    id: z.string(),
  })
  .openapi("AdminUnlikeForumReplyBody");

export const AdminUnlikeForumReplyResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
  })
  .openapi("AdminUnlikeForumReplyResponse");

export const unlikeForumReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = await AdminUnlikeForumReplyBodySchema.parseAsync(req.body);
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

    const responseBody = AdminUnlikeForumReplyResponseSchema.parse({
      success: true,
      message: "Forum unliked successfully",
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
