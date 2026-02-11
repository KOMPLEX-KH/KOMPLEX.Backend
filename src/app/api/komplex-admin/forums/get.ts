import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  forumComments,
  forumLikes,
  forumMedias,
  forumReplies,
  forums,
  users,
} from "@/db/schema.js";
import { forumCommentMedias } from "@/db/models/forum_comment_media.js";
import { forumReplyMedias } from "@/db/models/forum_reply_media.js";

export const getAllForums = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { type, topic } = req.query;

    const conditions = [];
    if (type) conditions.push(eq(forums.type, type as string));
    if (topic) conditions.push(eq(forums.topic, topic as string));

    const forumsQuery =
      conditions.length > 0
        ? db.select().from(forums).where(and(...conditions))
        : db.select().from(forums);

    const forumsData = await forumsQuery;

    const forumsWithDetails = await Promise.all(
      forumsData.map(async (forum) => {
        const media = await db
          .select({
            id: forumMedias.id,
            url: forumMedias.url,
            mediaType: forumMedias.mediaType,
          })
          .from(forumMedias)
          .where(eq(forumMedias.forumId, forum.id));

        const commentCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(forumComments)
          .where(eq(forumComments.forumId, forum.id));

        const replyCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(forumReplies)
          .leftJoin(
            forumComments,
            eq(forumComments.id, forumReplies.forumCommentId)
          )
          .where(eq(forumComments.forumId, forum.id));

        const likeCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(forumLikes)
          .where(eq(forumLikes.forumId, forum.id));

        let username;
        if (forum.userId) {
          const user = await db
            .select()
            .from(users)
            .where(eq(users.id, forum.userId));

          username = user[0]?.firstName + " " + user[0]?.lastName;
        }

        return {
          id: forum.id,
          title: forum.title,
          description: forum.description,
          type: forum.type,
          topic: forum.topic,
          viewCount: Number(forum.viewCount),
          likeCount: Number(likeCount[0]?.count || 0),
          commentCount: Number(commentCount[0]?.count || 0),
          replyCount: Number(replyCount[0]?.count || 0),
          createdAt: forum.createdAt,
          updatedAt: forum.updatedAt,
          username: username,
          media: media,
        };
      })
    );

    return res.status(200).json(forumsWithDetails);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
