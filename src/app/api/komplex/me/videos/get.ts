import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { eq, sql, and, desc } from "drizzle-orm";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import {
  videos,
  users,
  userSavedVideos,
  videoLikes,
} from "@/db/schema.js";
import { getResponseError } from "@/utils/responseError.js";

export const getAllMyVideos = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { topic, type, page } = req.query;

    const conditions = [];
    conditions.push(eq(videos.userId, userId));
    if (topic) conditions.push(eq(videos.topic, topic as string));
    if (type) conditions.push(eq(videos.type, type as string));

    const pageNumber = Number(page) || 1;
    const limit = 20;
    const offset = (pageNumber - 1) * limit;

    const cacheKey = `myVideos:${userId}:type:${type || "all"}:topic:${
      topic || "all"
    }:page:${pageNumber}`;
    const cached = await redis.get(cacheKey);
    const parsedData = cached ? JSON.parse(cached) : null;
    if (parsedData) {
      let dataToSend = [] as any[];
      await Promise.all(
        parsedData.data.map(async (video: any) => {
          const [freshVideoData] = await db
            .select({
              viewCount: videos.viewCount,
              likeCount: sql`COUNT(DISTINCT ${videoLikes.id})`,
            })
            .from(videos)
            .leftJoin(videoLikes, eq(videoLikes.videoId, videos.id))
            .where(eq(videos.id, video.id))
            .groupBy(videos.id);
          dataToSend.push({
            ...video,
            viewCount: freshVideoData.viewCount,
            likeCount: Number(freshVideoData.likeCount),
          });
        })
      );

      return res.status(200).json({
        data: [...dataToSend],
        hasMore: parsedData.length === limit,
      });
    }

    const videoRows = await db
      .select({
        id: videos.id,
        userId: videos.userId,
        title: videos.title,
        topic: videos.topic,
        type: videos.type,
        description: videos.description,
        duration: videos.duration,
        videoUrl: videos.videoUrl,
        thumbnailUrl: videos.thumbnailUrl,
        videoUrlForDeletion: videos.videoUrlForDeletion,
        thumbnailUrlForDeletion: videos.thumbnailUrlForDeletion,
        viewCount: videos.viewCount,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        username: sql`${users.firstName} || ' ' || ${users.lastName}`,
        profileImage: users.profileImage,
        isSaved: sql`CASE WHEN ${userSavedVideos.videoId} IS NOT NULL THEN true ELSE false END`,
        isLiked: sql`CASE WHEN ${videoLikes.videoId} IS NOT NULL THEN true ELSE false END`,
        likeCount: sql`COUNT(DISTINCT ${videoLikes.id})`,
        saveCount: sql`COUNT(DISTINCT ${userSavedVideos.id})`,
      })
      .from(videos)
      .leftJoin(users, eq(videos.userId, users.id))
      .leftJoin(
        userSavedVideos,
        and(
          eq(userSavedVideos.videoId, videos.id),
          eq(userSavedVideos.userId, Number(userId))
        )
      )
      .leftJoin(
        videoLikes,
        and(
          eq(videoLikes.videoId, videos.id),
          eq(videoLikes.userId, Number(userId))
        )
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(
        videos.id,
        users.firstName,
        users.lastName,
        userSavedVideos.videoId,
        videoLikes.videoId,
        userSavedVideos.id,
        videoLikes.id,
        users.profileImage
      )
      .limit(limit)
      .offset(offset)
      .orderBy(
        sql`CASE WHEN DATE(${videos.updatedAt}) = CURRENT_DATE THEN 1 ELSE 0 END DESC`,
        desc(videos.updatedAt)
      );

    await redis.set(
      cacheKey,
      JSON.stringify({ data: videoRows, hasMore: videoRows.length === limit }),
      {
        EX: 60 * 60 * 24,
      }
    );

    return res.status(200).json({
      data: videoRows,
      hasMore: videoRows.length === limit,
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
