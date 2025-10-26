import { eq, and, inArray } from "drizzle-orm";
import {
  forumComments,
  forumLikes,
  forumMedias,
  forumReplies,
  forums,
} from "../../../db/schema.js";
import { db } from "../../../db/index.js";
import { Request, Response } from "express";
import {
  deleteFromCloudflare,
  uploadImageToCloudflare,
} from "../../../db/cloudflare/cloudflareFunction.js";
import { forumCommentLikes } from "../../../db/models/forum_comment_like.js";
import { forumReplyLikes } from "../../../db/models/forum_reply_like.js";
import { forumReplyMedias } from "../../../db/models/forum_reply_media.js";
import { AuthenticatedRequest } from "../../../types/request.js";
import * as forumReplyService from "../services/forum-replies/service.js";
import * as forumReplyByIdService from "../services/forum-replies/[id]/service.js";

export const getAllRepliesForAComment = async (req: Request, res: Response) => {
  try {
    const { forumCommentId } = req.params;

    const replies = await forumReplyService.getAllRepliesForAComment(
      Number(forumCommentId)
    );

    return res.json(replies).status(200);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const postForumReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user ?? {};
    const { description, forumCommentId } = req.body;
    let public_url: string | null = null;
    let mediaType: "image" | "video" | null = null;

    const result = await forumReplyService.postForumReply(
      Number(userId),
      Number(forumCommentId),
      description,
      public_url || undefined,
      mediaType || undefined
    );

    return res.status(201).json({
      forum: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const likeForumCommentReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.body;
    const { userId } = req.user ?? {};

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await forumReplyByIdService.likeForumReply(
      Number(userId),
      Number(id)
    );

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const unlikeForumCommentReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.body;
    const { userId } = req.user ?? {};

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await forumReplyByIdService.unlikeForumReply(
      Number(userId),
      Number(id)
    );

    return res.json(result).status(200);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const updateForumReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { description, photosToRemove } = req.body;

    const result = await forumReplyByIdService.updateForumReply(
      Number(id),
      Number(userId),
      description,
      req.files as Express.Multer.File[] | undefined,
      photosToRemove
    );

    return res.status(200).json({
      updateReply: result.updateReply,
      newReplyMedia: result.newReplyMedia,
      deleteMedia: result.deleteMedia,
    });
  } catch (error) {
    if ((error as Error).message === "Reply not found") {
      return res
        .status(404)
        .json({ success: false, message: "Reply not found" });
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

export const deleteForumReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const result = await forumReplyByIdService.deleteForumReply(
      Number(id),
      Number(userId),
      deleteReply
    );

    return res.status(200).json({
      success: true,
      message: "Reply deleted successfully",
      ...result,
    });
  } catch (error) {
    if ((error as Error).message === "Reply not found") {
      return res
        .status(404)
        .json({ success: false, message: "Reply not found" });
    }
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

// Keep this exported function for use in other files (forum-comments)
export const deleteReply = async (
  userId: number,
  replyId: number | null,
  commentId: number | null
) => {
  if (replyId === null && commentId === null) {
    throw new Error("Either replyId or commentId must be provided");
  }

  if (replyId && commentId === null) {
    const mediasToDelete = await db
      .select({ urlForDeletion: forumReplyMedias.urlForDeletion })
      .from(forumReplyMedias)
      .where(eq(forumReplyMedias.forumReplyId, replyId));

    for (const media of mediasToDelete) {
      if (media.urlForDeletion) {
        await deleteFromCloudflare("komplex-image", media.urlForDeletion);
      }
    }

    const deletedMedia = await db
      .delete(forumReplyMedias)
      .where(eq(forumReplyMedias.forumReplyId, replyId))
      .returning({
        url: forumReplyMedias.url,
        mediaType: forumReplyMedias.mediaType,
      });

    const deletedReply = await db
      .delete(forumReplies)
      .where(and(eq(forumReplies.id, replyId), eq(forumReplies.userId, userId)))
      .returning();

    return { deletedReply, deletedMedia };
  }

  if (commentId && replyId === null) {
    const getReplyIdsByCommentId = await db
      .select({ id: forumReplies.id })
      .from(forumReplies)
      .where(eq(forumReplies.forumCommentId, commentId));
    const replyIds = getReplyIdsByCommentId.map((r) => r.id);

    const mediasToDelete = await db
      .select({ urlForDeletion: forumReplyMedias.urlForDeletion })
      .from(forumReplyMedias)
      .where(
        replyIds.length > 0
          ? inArray(forumReplyMedias.forumReplyId, replyIds)
          : eq(forumReplyMedias.forumReplyId, -1)
      );

    for (const media of mediasToDelete) {
      if (media.urlForDeletion) {
        await deleteFromCloudflare("komplex-image", media.urlForDeletion);
      }
    }

    const deletedMedia = await db
      .delete(forumReplyMedias)
      .where(
        replyIds.length > 0
          ? inArray(forumReplyMedias.forumReplyId, replyIds)
          : eq(forumReplyMedias.forumReplyId, -1)
      )
      .returning();

    const deletedReply = await db
      .delete(forumReplies)
      .where(
        replyIds.length > 0
          ? inArray(forumReplies.id, replyIds)
          : eq(forumReplies.id, -1)
      )
      .returning();

    return { deletedReply, deletedMedia };
  }
};
