import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db/index.js";
import { forumReplies } from "@/db/schema.js";
import { forumReplyLikes } from "@/db/models/forum_reply_like.js";
import { forumReplyMedias } from "@/db/models/forum_reply_media.js";
import {
  deleteFromCloudflare,
  uploadImageToCloudflare,
} from "@/db/cloudflare/cloudflareFunction.js";
import crypto from "crypto";

export const likeForumReply = async (userId: number, replyId: number) => {
  try {
    await db.insert(forumReplyLikes).values({
      userId: userId,
      forumReplyId: replyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true, message: "Forum liked successfully" };
  } catch (error) {
    throw new Error(`Failed to like reply: ${(error as Error).message}`);
  }
};

export const unlikeForumReply = async (userId: number, replyId: number) => {
  try {
    await db
      .delete(forumReplyLikes)
      .where(
        and(
          eq(forumReplyLikes.userId, userId),
          eq(forumReplyLikes.forumReplyId, replyId)
        )
      )
      .returning();

    return { success: true, message: "Forum unliked successfully" };
  } catch (error) {
    throw new Error(`Failed to unlike reply: ${(error as Error).message}`);
  }
};

export const updateForumReply = async (
  id: number,
  userId: number,
  description: string,
  files?: Express.Multer.File[],
  photosToRemove?: string
) => {
  try {
    const doesUserOwnThisReply = await db
      .select()
      .from(forumReplies)
      .where(and(eq(forumReplies.id, id), eq(forumReplies.userId, userId)))
      .limit(1);

    if (doesUserOwnThisReply.length === 0) {
      throw new Error("Reply not found");
    }

    let photosToRemoveParse: { url: string }[] = [];
    if (photosToRemove) {
      try {
        photosToRemoveParse = JSON.parse(photosToRemove);
      } catch (err) {
        throw new Error("Invalid photosToRemove format");
      }
    }

    let newReplyMedia: any[] = [];
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
            .insert(forumReplyMedias)
            .values({
              forumReplyId: id,
              url: url,
              urlForDeletion: uniqueKey,
              mediaType: file.mimetype.startsWith("video") ? "video" : "image",
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          newReplyMedia.push(media);
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
              urlForDeletion: forumReplyMedias.urlForDeletion,
            })
            .from(forumReplyMedias)
            .where(eq(forumReplyMedias.url, photoToRemove.url));
          let deleted = null;
          if (urlForDeletion[0]?.urlForDeletion) {
            await deleteFromCloudflare(
              "komplex-image",
              urlForDeletion[0].urlForDeletion
            );
            deleted = await db
              .delete(forumReplyMedias)
              .where(
                and(
                  eq(forumReplyMedias.forumReplyId, id),
                  eq(
                    forumReplyMedias.urlForDeletion,
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

    const [updateReply] = await db
      .update(forumReplies)
      .set({
        description,
        updatedAt: new Date(),
      })
      .where(eq(forumReplies.id, id))
      .returning();

    return { updateReply, newReplyMedia, deleteMedia };
  } catch (error) {
    throw new Error(`Failed to update reply: ${(error as Error).message}`);
  }
};

export const deleteForumReply = async (
  id: number,
  userId: number,
  deleteReplyHelper: (
    userId: number,
    replyId: number | null,
    commentId: number | null
  ) => Promise<any>
) => {
  try {
    const doesUserOwnThisReply = await db
      .select()
      .from(forumReplies)
      .where(and(eq(forumReplies.id, id), eq(forumReplies.userId, userId)))
      .limit(1);

    if (doesUserOwnThisReply.length === 0) {
      throw new Error("Reply not found");
    }

    const result = await deleteReplyHelper(userId, id, null);

    return result;
  } catch (error) {
    throw new Error(`Failed to delete reply: ${(error as Error).message}`);
  }
};
