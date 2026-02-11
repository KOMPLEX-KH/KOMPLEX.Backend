import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { forumReplies } from "@/db/schema.js";
import { forumReplyMedias } from "@/db/models/forum_reply_media.js";

export const getAllRepliesForAComment = async (forumCommentId: number) => {
  try {
    const replies = await db
      .select()
      .from(forumReplies)
      .where(eq(forumReplies.forumCommentId, forumCommentId));

    return replies;
  } catch (error) {
    throw new Error(`Failed to get replies: ${(error as Error).message}`);
  }
};

export const postForumReply = async (
  userId: number,
  forumCommentId: number,
  description: string,
  publicUrl?: string,
  mediaType?: "image" | "video"
) => {
  try {
    const insertedForumReply = await db
      .insert(forumReplies)
      .values({
        userId: userId,
        forumCommentId: forumCommentId,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (publicUrl) {
      await db.insert(forumReplyMedias).values({
        forumReplyId: insertedForumReply[0].id,
        url: publicUrl,
        mediaType,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return insertedForumReply[0];
  } catch (error) {
    throw new Error(`Failed to create reply: ${(error as Error).message}`);
  }
};
