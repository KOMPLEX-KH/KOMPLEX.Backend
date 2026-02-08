import { eq, and, inArray, sql } from "drizzle-orm";
import {
  forumComments,
  forumLikes,
  forumMedias,
  forumReplies,
  forums,
  users,
} from "../../../db/schema.js";
import { db } from "../../../db/index.js";
import { Request, Response } from "express";
import { forumCommentLikes } from "../../../db/models/forum_comment_like.js";
import { forumCommentMedias } from "../../../db/models/forum_comment_media.js";
import { forumReplyMedias } from "../../../db/models/forum_reply_media.js";
import { AuthenticatedRequest } from "../../../types/request.js";
import {
  deleteFromCloudflare,
  uploadImageToCloudflare,
} from "../../../db/cloudflare/cloudflareFunction.js";
import { deleteReply } from "./forum-replies.controller.js";
import * as forumCommentService from "../services/forum-comments/service.js";
import * as forumCommentByIdService from "../services/forum-comments/[id]/service.js";

export const getAllCommentsForAForum = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const commentsWithMedia = await forumCommentService.getAllCommentsForAForum(
      Number(id),
      Number(userId),
    );

    return res.status(200).json(commentsWithMedia);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const postForumComment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { userId } = req.user;
    const { description } = req.body;
    const { id } = req.params;

    if (!userId || !id || !description) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const result = await forumCommentService.postForumComment(
      Number(userId),
      Number(id),
      description,
      req.files as Express.Multer.File[] | undefined,
    );

    return res.status(201).json({
      success: true,
      comment: result.comment,
      newCommentMedia: result.newCommentMedia,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const likeForumComment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const like = await forumCommentByIdService.likeForumComment(
      Number(userId),
      Number(id),
    );

    return res.status(200).json({ like });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const unlikeForumComment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const unlike = await forumCommentByIdService.unlikeForumComment(
      Number(userId),
      Number(id),
    );

    return res.status(200).json({ unlike });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const updateForumComment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { description, photosToRemove } = req.body;

    const result = await forumCommentByIdService.updateForumComment(
      Number(id),
      Number(userId),
      description,
      req.files as Express.Multer.File[] | undefined,
      photosToRemove,
    );

    return res.status(200).json({
      updateComment: result.updateComment,
      newCommentMedia: result.newCommentMedia,
      deleteMedia: result.deleteMedia,
    });
  } catch (error) {
    if ((error as Error).message === "Comment not found") {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }
    if ((error as Error).message === "Invalid photosToRemove format") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid photosToRemove format" });
    }
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const deleteForumComment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const result = await forumCommentByIdService.deleteForumComment(
      Number(id),
      Number(userId),
      deleteReply,
    );

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      replyResults: result.replyResults,
      commentResults: result.commentResults,
    });
  } catch (error) {
    if ((error as Error).message === "Comment not found") {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

// Keep this exported function for use in other files
export const deleteComment = async (
  userId: number,
  commentId: number | null,
  forumId: number | null,
) => {
  if (commentId === null && forumId === null) {
    throw new Error("Either commentId or forumId must be provided");
  }

  if (commentId && forumId === null) {
    const mediasToDelete = await db
      .select({ urlForDeletion: forumCommentMedias.urlForDeletion })
      .from(forumCommentMedias)
      .where(eq(forumCommentMedias.forumCommentId, commentId));

    for (const media of mediasToDelete) {
      if (media.urlForDeletion) {
        await deleteFromCloudflare("komplex-image", media.urlForDeletion);
      }
    }

    const deletedMedia = await db
      .delete(forumCommentMedias)
      .where(eq(forumCommentMedias.forumCommentId, commentId))
      .returning({
        url: forumCommentMedias.url,
        mediaType: forumCommentMedias.mediaType,
      });

    const deletedLikes = await db
      .delete(forumCommentLikes)
      .where(eq(forumCommentLikes.forumCommentId, commentId))
      .returning();

    const deletedComment = await db
      .delete(forumComments)
      .where(
        and(eq(forumComments.id, commentId), eq(forumComments.userId, userId)),
      )
      .returning();

    return { deletedComment, deletedMedia, deletedLikes };
  }

  if (forumId && commentId === null) {
    const getCommentIdsByForumId = await db
      .select({ id: forumComments.id })
      .from(forumComments)
      .where(eq(forumComments.forumId, forumId));
    const commentIds = getCommentIdsByForumId.map((c) => c.id);

    const mediasToDelete = await db
      .select({ urlForDeletion: forumCommentMedias.urlForDeletion })
      .from(forumCommentMedias)
      .where(
        commentIds.length > 0
          ? inArray(forumCommentMedias.forumCommentId, commentIds)
          : eq(forumCommentMedias.forumCommentId, -1),
      );

    for (const media of mediasToDelete) {
      if (media.urlForDeletion) {
        await deleteFromCloudflare("komplex-image", media.urlForDeletion);
      }
    }

    const deletedMedia = await db
      .delete(forumCommentMedias)
      .where(
        commentIds.length > 0
          ? inArray(forumCommentMedias.forumCommentId, commentIds)
          : eq(forumCommentMedias.forumCommentId, -1),
      )
      .returning();

    const deletedLikes = await db
      .delete(forumCommentLikes)
      .where(
        commentIds.length > 0
          ? inArray(forumCommentLikes.forumCommentId, commentIds)
          : eq(forumCommentLikes.forumCommentId, -1),
      )
      .returning();

    const deletedComment = await db
      .delete(forumComments)
      .where(
        commentIds.length > 0
          ? inArray(forumComments.id, commentIds)
          : eq(forumComments.id, -1),
      )
      .returning();

    return { deletedComment, deletedMedia, deletedLikes };
  }
};
