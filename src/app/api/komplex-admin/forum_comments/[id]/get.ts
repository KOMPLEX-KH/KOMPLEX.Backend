import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";
import { eq, and, inArray, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { forumComments, users } from "@/db/schema.js";
import { forumCommentLikes } from "@/db/models/forum_comment_like.js";
import { forumCommentMedias } from "@/db/models/forum_comment_media.js";

export const getAllCommentsForAForum = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const comments = await db
      .select({
        id: forumComments.id,
        userId: forumComments.userId,
        forumId: forumComments.forumId,
        description: forumComments.description,
        createdAt: forumComments.createdAt,
        updatedAt: forumComments.updatedAt,
        mediaUrl: forumCommentMedias.url,
        mediaType: forumCommentMedias.mediaType,
        username: sql`${users.firstName} || ' ' || ${users.lastName}`,
        isLike: sql`CASE WHEN ${forumCommentLikes.forumCommentId} IS NOT NULL THEN true ELSE false END`,
      })
      .from(forumComments)
      .leftJoin(
        forumCommentMedias,
        eq(forumComments.id, forumCommentMedias.forumCommentId)
      )
      .leftJoin(
        forumCommentLikes,
        and(
          eq(forumCommentLikes.forumCommentId, forumComments.id),
          eq(forumCommentLikes.userId, Number(userId))
        )
      )
      .leftJoin(users, eq(users.id, forumComments.userId))
      .where(eq(forumComments.forumId, Number(id)));

    if (!comments || comments.length === 0) {
      return res.status(200).json([]);
    }

    const commentsWithMedia = Object.values(
      comments.reduce((acc, comment) => {
        if (!acc[comment.id]) {
          acc[comment.id] = {
            id: comment.id,
            userId: comment.userId,
            forumId: comment.forumId,
            description: comment.description,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            media: [] as { url: string; type: string }[],
            username: comment.username,
            isLike: !!comment.isLike,
          };
        }
        if (comment.mediaUrl) {
          acc[comment.id].media.push({
            url: comment.mediaUrl,
            type: comment.mediaType,
          });
        }
        return acc;
      }, {} as { [key: number]: any })
    ) as Record<number, any>[];

    return res.status(200).json(commentsWithMedia);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
