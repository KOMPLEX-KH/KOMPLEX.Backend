import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { sendResponseError, ResponseError } from "@/utils/response.js";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import {
  forumComments,
  forumMedias,
  forumReplies,
  forums,
} from "@/db/drizzle/schema.js";
import { forumCommentMedias } from "@/db/drizzle/models/forum_comment_media.js";
import { forumReplyMedias } from "@/db/drizzle/models/forum_reply_media.js";
import { z } from "@/config/openapi/openapi.js";

export const AdminDeleteForumParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("AdminDeleteForumParams");

export const AdminDeleteForumResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
  })
  .openapi("AdminDeleteForumResponse");

export const deleteForum = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.user ?? {};
    const { id } = await AdminDeleteForumParamsSchema.parseAsync(req.params);

    const getCorrectUser = await db
      .select()
      .from(forums)
      .where(eq(forums.userId, Number(userId)));

    if (!getCorrectUser || getCorrectUser.length === 0) {
      throw new ResponseError("Forum not found", 404);
    }

    const doesForumExist = await db
      .select()
      .from(forums)
      .where(eq(forums.id, Number(id)));

    if (doesForumExist.length === 0) {
      throw new ResponseError("Forum not found", 404);
    }

    const comments = await db
      .select({ id: forumComments.id })
      .from(forumComments)
      .where(eq(forumComments.forumId, Number(id)));
    const commentIds = comments.map((c) => c.id);

    let replyIds: number[] = [];
    if (commentIds.length > 0) {
      const replies = await db
        .select({ id: forumReplies.id })
        .from(forumReplies)
        .where(inArray(forumReplies.forumCommentId, commentIds));
      replyIds = replies.map((r) => r.id);
    }

    await db.transaction(async (tx) => {
      if (replyIds.length > 0) {
        await tx
          .delete(forumReplyMedias)
          .where(inArray(forumReplyMedias.forumReplyId, replyIds));
      }
      if (commentIds.length > 0) {
        await tx
          .delete(forumCommentMedias)
          .where(inArray(forumCommentMedias.forumCommentId, commentIds));
      }
      if (replyIds.length > 0) {
        await tx
          .delete(forumReplies)
          .where(inArray(forumReplies.forumCommentId, commentIds));
      }
      if (commentIds.length > 0) {
        await tx
          .delete(forumComments)
          .where(inArray(forumComments.id, commentIds));
      }
      await tx
        .delete(forumMedias)
        .where(eq(forumMedias.forumId, Number(id)));
      await tx.delete(forums).where(eq(forums.id, Number(id)));
    });

    const responseBody = AdminDeleteForumResponseSchema.parse({
      success: true,
      message: "Forum deleted successfully",
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return sendResponseError(res, error as Error);
  }
};
