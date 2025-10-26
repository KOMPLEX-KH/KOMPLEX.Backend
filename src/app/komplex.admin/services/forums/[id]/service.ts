import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  forumComments,
  forumLikes,
  forumMedias,
  forumReplies,
  forums,
} from "@/db/schema.js";
import { forumCommentMedias } from "@/db/models/forum_comment_media.js";
import { forumReplyMedias } from "@/db/models/forum_reply_media.js";

export const getForumById = async (id: number) => {
  try {
    const forum = await db
      .select()
      .from(forums)
      .where(eq(forums.id, id))
      .limit(1);

    if (!forum || forum.length === 0 || !forum[0]) {
      throw new Error("Forum not found");
    }

    await db
      .update(forums)
      .set({
        viewCount: (forum[0]?.viewCount ?? 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(forums.id, id))
      .returning();

    return forum[0];
  } catch (error) {
    throw new Error(`Failed to get forum: ${(error as Error).message}`);
  }
};

export const updateForum = async (
  id: number,
  userId: number,
  title: string,
  description: string,
  type: string,
  topic: string,
  publicUrl?: string,
  mediaType?: "image" | "video"
) => {
  try {
    const getCorrectUser = await db
      .select()
      .from(forums)
      .where(eq(forums.userId, userId));

    if (!getCorrectUser || getCorrectUser.length === 0) {
      throw new Error("Forum not found");
    }

    const insertedForums = await db
      .update(forums)
      .set({
        userId: Number(userId),
        title,
        description,
        type,
        topic,
        updatedAt: new Date(),
      })
      .where(eq(forums.id, id))
      .returning();

    const newForum = insertedForums[0];

    let newMedia = null;

    if (publicUrl && mediaType) {
      const oldMediaUrl = await db
        .select()
        .from(forumMedias)
        .where(eq(forumMedias.forumId, newForum.id));

      newMedia = await db
        .update(forumMedias)
        .set({
          url: publicUrl,
          mediaType,
        })
        .where(eq(forumMedias.forumId, newForum.id))
        .returning();
    }

    return {
      forum: newForum,
      media: newMedia,
    };
  } catch (error) {
    throw new Error(`Failed to update forum: ${(error as Error).message}`);
  }
};

export const deleteForum = async (id: number, userId: number) => {
  try {
    const getCorrectUser = await db
      .select()
      .from(forums)
      .where(eq(forums.userId, userId));

    if (!getCorrectUser || getCorrectUser.length === 0) {
      throw new Error("Forum not found");
    }

    const doesForumExist = await db
      .select()
      .from(forums)
      .where(eq(forums.id, id));

    if (doesForumExist.length > 0) {
      const doesCommentExist = await db
        .select()
        .from(forumComments)
        .where(eq(forumComments.forumId, id));

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

      await db.delete(forums).where(eq(forums.id, id)).returning();
    } else {
      throw new Error("Forum not found");
    }

    const mediaForum = await db
      .select()
      .from(forumMedias)
      .where(eq(forumMedias.forumId, id));

    const comments = await db
      .select()
      .from(forumComments)
      .where(eq(forumComments.forumId, id));

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

    for (const m of mediaForum) {
      if (m.url) {
        // await deleteFromCloudinary(m.url, m.mediaType ?? undefined);
      }
    }
    await db.delete(forumMedias).where(eq(forumMedias.forumId, id));

    for (const m of mediaForumComment) {
      if (m.url) {
        // await deleteFromCloudinary(m.url, m.mediaType ?? undefined);
      }
    }
    if (commentIds.length > 0) {
      await db
        .delete(forumCommentMedias)
        .where(inArray(forumCommentMedias.forumCommentId, commentIds));
    }

    for (const m of mediaForumReply) {
      if (m.url) {
        // await deleteFromCloudinary(m.url, m.mediaType ?? undefined);
      }
    }
    if (replyIds.length > 0) {
      await db
        .delete(forumReplyMedias)
        .where(inArray(forumReplyMedias.forumReplyId, replyIds));
    }

    return { success: true, message: "Forum deleted successfully" };
  } catch (error) {
    throw new Error(`Failed to delete forum: ${(error as Error).message}`);
  }
};
