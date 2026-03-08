import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/response.js";
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

    if (doesForumExist.length > 0) {
      const doesCommentExist = await db
        .select()
        .from(forumComments)
        .where(eq(forumComments.forumId, Number(id)));

      const deletedCommentsId = doesCommentExist.map((comment) => comment.id);

      if (deletedCommentsId.length > 0) {
        await db
          .delete(forumReplies)
          .where(inArray(forumReplies.forumCommentId, deletedCommentsId))
          .returning();
      }

      await db
        .delete(forumComments)
        .where(inArray(forumComments.id, deletedCommentsId))
        .returning();

      await db.delete(forums).where(eq(forums.id, Number(id))).returning();
    } else {
      throw new ResponseError("Forum not found", 404);
    }

    const mediaForum = await db
      .select()
      .from(forumMedias)
      .where(eq(forumMedias.forumId, Number(id)));

    const comments = await db
      .select()
      .from(forumComments)
      .where(eq(forumComments.forumId, Number(id)));

    const commentIds = comments.map((c) => c.id);

    let mediaForumComment: Array<{
      id: number;
      forumCommentId: number | null;
      url: string | null;
      mediaType: "image" | "video" | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    }> = [];

    if (commentIds.length > 0) {
      mediaForumComment = await db
        .select()
        .from(forumCommentMedias)
        .where(inArray(forumCommentMedias.forumCommentId, commentIds));
    }

    let replies: Array<typeof forumReplies.$inferSelect> = [];
    if (commentIds.length > 0) {
      replies = await db
        .select()
        .from(forumReplies)
        .where(inArray(forumReplies.forumCommentId, commentIds));
    }

    const replyIds = replies.map((r) => r.id);

    let mediaForumReply: Array<{
      id: number;
      forumReplyId: number | null;
      url: string | null;
      mediaType: "image" | "video" | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    }> = [];

    if (replyIds.length > 0) {
      mediaForumReply = await db
        .select()
        .from(forumReplyMedias)
        .where(inArray(forumReplyMedias.forumReplyId, replyIds));
    }

    await db.delete(forumMedias).where(eq(forumMedias.forumId, Number(id)));

    if (commentIds.length > 0) {
      await db
        .delete(forumCommentMedias)
        .where(inArray(forumCommentMedias.forumCommentId, commentIds));
    }

    if (replyIds.length > 0) {
      await db
        .delete(forumReplyMedias)
        .where(inArray(forumReplyMedias.forumReplyId, replyIds));
    }

    const responseBody = AdminDeleteForumResponseSchema.parse({
      success: true,
      message: "Forum deleted successfully",
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
