import { eq, and, inArray, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { forumComments, users } from "@/db/schema.js";
import { forumCommentLikes } from "@/db/models/forum_comment_like.js";
import { forumCommentMedias } from "@/db/models/forum_comment_media.js";
import { uploadImageToCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import crypto from "crypto";

export const getAllCommentsForAForum = async (
  forumId: number,
  userId: number
) => {
  try {
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
          eq(forumCommentLikes.userId, userId)
        )
      )
      .leftJoin(users, eq(users.id, forumComments.userId))
      .where(eq(forumComments.forumId, forumId));

    if (!comments || comments.length === 0) {
      return [];
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

    return commentsWithMedia;
  } catch (error) {
    throw new Error(`Failed to get comments: ${(error as Error).message}`);
  }
};

export const postForumComment = async (
  userId: number,
  forumId: number,
  description: string,
  files?: Express.Multer.File[]
) => {
  try {
    const [insertedForumComment] = await db
      .insert(forumComments)
      .values({
        userId: userId,
        forumId: forumId,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    let newCommentMedia: any[] = [];
    if (files) {
      for (const file of files) {
        try {
          const uniqueKey = `${
            insertedForumComment.id
          }-${crypto.randomUUID()}-${file.originalname}`;
          const url = await uploadImageToCloudflare(
            uniqueKey,
            file.buffer,
            file.mimetype
          );
          const [media] = await db
            .insert(forumCommentMedias)
            .values({
              forumCommentId: insertedForumComment.id,
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

    return {
      comment: insertedForumComment,
      newCommentMedia,
    };
  } catch (error) {
    throw new Error(`Failed to create comment: ${(error as Error).message}`);
  }
};
