import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db/index.js";
import { forumComments } from "@/db/schema.js";
import { forumCommentLikes } from "@/db/models/forum_comment_like.js";
import { forumCommentMedias } from "@/db/models/forum_comment_media.js";
import {
  deleteFromCloudflare,
  uploadImageToCloudflare,
} from "@/db/cloudflare/cloudflareFunction.js";
import crypto from "crypto";

export const likeForumComment = async (userId: number, commentId: number) => {
  try {
    const like = await db
      .insert(forumCommentLikes)
      .values({
        userId: userId,
        forumCommentId: commentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return like;
  } catch (error) {
    throw new Error(`Failed to like comment: ${(error as Error).message}`);
  }
};

export const unlikeForumComment = async (userId: number, commentId: number) => {
  try {
    const unlike = await db
      .delete(forumCommentLikes)
      .where(
        and(
          eq(forumCommentLikes.userId, userId),
          eq(forumCommentLikes.forumCommentId, commentId)
        )
      )
      .returning();

    return unlike;
  } catch (error) {
    throw new Error(`Failed to unlike comment: ${(error as Error).message}`);
  }
};

export const updateForumComment = async (
  id: number,
  userId: number,
  description: string,
  files?: Express.Multer.File[],
  photosToRemove?: string
) => {
  try {
    const doesUserOwnThisComment = await db
      .select()
      .from(forumComments)
      .where(and(eq(forumComments.id, id), eq(forumComments.userId, userId)))
      .limit(1);

    if (doesUserOwnThisComment.length === 0) {
      throw new Error("Comment not found");
    }

    let photosToRemoveParse: { url: string }[] = [];
    if (photosToRemove) {
      try {
        photosToRemoveParse = JSON.parse(photosToRemove);
      } catch (err) {
        throw new Error("Invalid photosToRemove format");
      }
    }

    let newCommentMedia: any[] = [];
    if (files) {
      for (const file of files) {
        try {
          const uniqueKey = `${id}-${crypto.randomUUID()}-${file.originalname}`;
          const url = await uploadImageToCloudflare(
            uniqueKey,
            file.buffer,
            file.mimetype
          );
          const [media] = await db
            .insert(forumCommentMedias)
            .values({
              forumCommentId: id,
              url: url,
              urlForDeletion: uniqueKey,
              mediaType: file.mimetype.startsWith("video") ? "video" : "image",
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          newCommentMedia.push(media);
        } catch (error) {
          console.error("Error uploading file or saving media:", error);
        }
      }
    }

    let deleteMedia = null;
    if (photosToRemoveParse && photosToRemoveParse.length > 0) {
      const deleteResults = await Promise.all(
        photosToRemoveParse.map(async (photoToRemove: any) => {
          const urlForDeletion = await db
            .select({
              urlForDeletion: forumCommentMedias.urlForDeletion,
            })
            .from(forumCommentMedias)
            .where(eq(forumCommentMedias.url, photoToRemove.url));
          let deleted = null;
          if (urlForDeletion[0]?.urlForDeletion) {
            await deleteFromCloudflare(
              "komplex-image",
              urlForDeletion[0].urlForDeletion
            );
            deleted = await db
              .delete(forumCommentMedias)
              .where(
                and(
                  eq(forumCommentMedias.forumCommentId, id),
                  eq(
                    forumCommentMedias.urlForDeletion,
                    urlForDeletion[0].urlForDeletion
                  )
                )
              )
              .returning();
          }
          return deleted;
        })
      );

      deleteMedia = deleteResults.flat();
    }

    const [updateComment] = await db
      .update(forumComments)
      .set({
        description,
        updatedAt: new Date(),
      })
      .where(eq(forumComments.id, id))
      .returning();

    return { updateComment, newCommentMedia, deleteMedia };
  } catch (error) {
    throw new Error(`Failed to update comment: ${(error as Error).message}`);
  }
};

export const deleteForumComment = async (
  id: number,
  userId: number,
  deleteReplyFunction: (
    userId: number,
    replyId: number | null,
    commentId: number
  ) => Promise<any>
) => {
  try {
    const doesUserOwnThisComment = await db
      .select()
      .from(forumComments)
      .where(and(eq(forumComments.id, id), eq(forumComments.userId, userId)))
      .limit(1);

    if (doesUserOwnThisComment.length === 0) {
      throw new Error("Comment not found");
    }

    // Check if comment has replies and delete them
    let replyResults = null;
    const doesThisCommentHasReply = await db
      .select()
      .from(forumComments)
      .where(eq(forumComments.id, id));

    if (doesThisCommentHasReply.length > 0) {
      replyResults = await deleteReplyFunction(userId, null, id);
    }

    // Delete the comment itself
    const commentResults = await deleteComment(userId, id, null);

    return {
      replyResults,
      commentResults,
    };
  } catch (error) {
    throw new Error(`Failed to delete comment: ${(error as Error).message}`);
  }
};

const deleteComment = async (
  userId: number,
  commentId: number | null,
  forumId: number | null
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
        and(eq(forumComments.id, commentId), eq(forumComments.userId, userId))
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
          : eq(forumCommentMedias.forumCommentId, -1)
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
          : eq(forumCommentMedias.forumCommentId, -1)
      )
      .returning();

    const deletedLikes = await db
      .delete(forumCommentLikes)
      .where(
        commentIds.length > 0
          ? inArray(forumCommentLikes.forumCommentId, commentIds)
          : eq(forumCommentLikes.forumCommentId, -1)
      )
      .returning();

    const deletedComment = await db
      .delete(forumComments)
      .where(
        commentIds.length > 0
          ? inArray(forumComments.id, commentIds)
          : eq(forumComments.id, -1)
      )
      .returning();

    return { deletedComment, deletedMedia, deletedLikes };
  }
};
