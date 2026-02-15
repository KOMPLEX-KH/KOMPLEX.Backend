import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { db } from "@/db/drizzle/index.js";
import {
  videoComments,
  videoCommentMedias,
  videoCommentLike,
  users,
} from "@/db/drizzle/schema.js";
import { and, desc, eq, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redis.js";
import { getResponseError } from "@/utils/response.js";

export const getVideoComments = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { page } = req.query;
    const pageNumber = Number(page) || 1;
    const limit = 20;
    const offset = (pageNumber - 1) * limit;

    const cacheKey = `videoComments:video:${id}:page:${pageNumber}`;
    const cached = await redis.get(cacheKey);

    let cachedComments: any[] = [];
    if (cached) {
      cachedComments = JSON.parse(cached);
    }

    const dynamicData = await db
      .select({
        id: videoComments.id,
        likeCount: sql`COUNT(DISTINCT ${videoCommentLike.videoCommentId})`,
        isLiked: sql`CASE WHEN ${videoCommentLike.videoCommentId} IS NOT NULL THEN true ELSE false END`,
        profileImage: users.profileImage,
      })
      .from(videoComments)
      .leftJoin(
        videoCommentLike,
        and(
          eq(videoCommentLike.videoCommentId, videoComments.id),
          eq(videoCommentLike.userId, Number(userId))
        )
      )
      .leftJoin(users, eq(users.id, videoComments.userId))
      .where(eq(videoComments.videoId, Number(id)))
      .groupBy(
        videoComments.id,
        videoCommentLike.videoCommentId,
        users.profileImage
      )
      .offset(offset)
      .limit(limit);

    if (!cachedComments.length) {
      const commentRows = await db
        .select({
          id: videoComments.id,
          userId: videoComments.userId,
          videoId: videoComments.videoId,
          description: videoComments.description,
          createdAt: videoComments.createdAt,
          updatedAt: videoComments.updatedAt,
          mediaUrl: videoCommentMedias.url,
          mediaType: videoCommentMedias.mediaType,
          username: sql`${users.firstName} || ' ' || ${users.lastName}`,
          profileImage: users.profileImage,
        })
        .from(videoComments)
        .leftJoin(
          videoCommentMedias,
          eq(videoComments.id, videoCommentMedias.videoCommentId)
        )
        .leftJoin(users, eq(users.id, videoComments.userId))
        .leftJoin(
          videoCommentLike,
          eq(videoComments.id, videoCommentLike.videoCommentId)
        )
        .where(eq(videoComments.videoId, Number(id)))
        .groupBy(
          videoComments.id,
          videoComments.userId,
          videoComments.videoId,
          videoComments.description,
          videoComments.createdAt,
          videoComments.updatedAt,
          videoCommentMedias.url,
          videoCommentMedias.mediaType,
          users.firstName,
          users.lastName,
          users.profileImage
        )
        .orderBy(
          desc(sql`COUNT(DISTINCT ${videoCommentLike.id})`),
          desc(
            sql`CASE WHEN DATE(${videoComments.updatedAt}) = CURRENT_DATE THEN 1 ELSE 0 END`
          ),
          desc(videoComments.updatedAt)
        )
        .offset(offset)
        .limit(limit);

      cachedComments = Object.values(
        commentRows.reduce((acc, comment) => {
          if (!acc[comment.id]) {
            acc[comment.id] = {
              id: comment.id,
              userId: comment.userId,
              videoId: comment.videoId,
              description: comment.description,
              createdAt: comment.createdAt,
              updatedAt: comment.updatedAt,
              media: [] as { url: string; type: string }[],
              username: comment.username,
              profileImage: comment.profileImage,
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
      );

      await redis.set(cacheKey, JSON.stringify(cachedComments), { EX: 60 });
    }

    const commentsWithMedia = cachedComments.map((c) => {
      const dynamic = dynamicData.find((d) => d.id === c.id);
      return {
        ...c,
        likeCount: Number(dynamic?.likeCount) || 0,
        isLiked: !!dynamic?.isLiked,
        profileImage: dynamic?.profileImage || c.profileImage,
      };
    });

    return res.status(200).json({
      data: commentsWithMedia,
      hasMore: commentsWithMedia.length === limit,
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
