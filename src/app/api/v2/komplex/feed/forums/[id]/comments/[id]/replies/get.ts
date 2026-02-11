import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";
import { and, eq, desc, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import {
  forumReplies,
  forumReplyMedias,
  users,
  forumReplyLikes,
} from "@/db/schema.js";

export const getForumReplies = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { page } = req.query;
    const pageNumber = Number(page) || 1;
    const limit = 20;
    const offset = (pageNumber - 1) * limit;

    const cacheKey = `forumReplies:comment:${id}:page:${pageNumber}`;
    const cached = await redis.get(cacheKey);

    let cachedReplies: any[] = [];
    if (cached) {
      cachedReplies = JSON.parse(cached).repliesWithMedia;
    }

    const dynamicData = await db
      .select({
        id: forumReplies.id,
        likeCount: sql`COUNT(DISTINCT ${forumReplyLikes.forumReplyId})`,
        isLiked: sql`CASE WHEN ${forumReplyLikes.forumReplyId} IS NOT NULL THEN true ELSE false END`,
        profileImage: users.profileImage,
      })
      .from(forumReplies)
      .leftJoin(
        forumReplyLikes,
        and(
          eq(forumReplyLikes.forumReplyId, forumReplies.id),
          eq(forumReplyLikes.userId, Number(userId))
        )
      )
      .leftJoin(users, eq(users.id, forumReplies.userId))
      .where(eq(forumReplies.forumCommentId, Number(id)))
      .groupBy(forumReplies.id, forumReplyLikes.forumReplyId, users.profileImage)
      .offset(offset)
      .limit(limit);

    if (!cachedReplies.length) {
      const replyRows = await db
        .select({
          id: forumReplies.id,
          userId: forumReplies.userId,
          forumCommentId: forumReplies.forumCommentId,
          description: forumReplies.description,
          createdAt: forumReplies.createdAt,
          updatedAt: forumReplies.updatedAt,
          mediaUrl: forumReplyMedias.url,
          mediaType: forumReplyMedias.mediaType,
          username: sql`${users.firstName} || ' ' || ${users.lastName}`,
          profileImage: users.profileImage,
        })
        .from(forumReplies)
        .leftJoin(
          forumReplyMedias,
          eq(forumReplies.id, forumReplyMedias.forumReplyId)
        )
        .leftJoin(users, eq(users.id, forumReplies.userId))
        .leftJoin(
          forumReplyLikes,
          eq(forumReplies.id, forumReplyLikes.forumReplyId)
        )
        .where(eq(forumReplies.forumCommentId, Number(id)))
        .groupBy(
          forumReplies.id,
          forumReplies.userId,
          forumReplies.forumCommentId,
          forumReplies.description,
          forumReplies.createdAt,
          forumReplies.updatedAt,
          forumReplyMedias.url,
          forumReplyMedias.mediaType,
          users.firstName,
          users.lastName,
          users.profileImage
        )
        .orderBy(
          desc(sql`COUNT(DISTINCT ${forumReplyLikes.id})`),
          desc(
            sql`CASE WHEN DATE(${forumReplies.updatedAt}) = CURRENT_DATE THEN 1 ELSE 0 END`
          ),
          desc(forumReplies.updatedAt)
        )
        .offset(offset)
        .limit(limit);

      cachedReplies = Object.values(
        replyRows.reduce((acc, reply) => {
          if (!acc[reply.id]) {
            acc[reply.id] = {
              id: reply.id,
              userId: reply.userId,
              forumCommentId: reply.forumCommentId,
              description: reply.description,
              createdAt: reply.createdAt,
              updatedAt: reply.updatedAt,
              media: [] as { url: string; type: string }[],
              username: reply.username,
              profileImage: reply.profileImage,
            };
          }
          if (reply.mediaUrl) {
            acc[reply.id].media.push({
              url: reply.mediaUrl,
              type: reply.mediaType,
            });
          }
          return acc;
        }, {} as { [key: number]: any })
      );

      await redis.set(
        cacheKey,
        JSON.stringify({ repliesWithMedia: cachedReplies }),
        { EX: 60 }
      );
    }

    const repliesWithMedia = cachedReplies.map((r) => {
      const dynamic = dynamicData.find((d) => d.id === r.id);
      return {
        ...r,
        likeCount: Number(dynamic?.likeCount) || 0,
        isLiked: !!dynamic?.isLiked,
        profileImage: dynamic?.profileImage || r.profileImage,
      };
    });

    return res.status(200).json({
      data: repliesWithMedia,
      hasMore: repliesWithMedia.length === limit,
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
