import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";
import { getResponseError, getResponseSuccess, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { videos } from "@/db/drizzle/models/videos.js";
import { redis } from "@/db/redis/redis.js";
import { followers, users, userSavedVideos, videoLikes } from "@/db/drizzle/schema.js";
import { meilisearch } from "@/config/meilisearch/meilisearchConfig.js";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const VideoSearchItemSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  type: z.string(),
  topic: z.string().nullable().optional(),
  duration: z.number().nullable().optional(),
  videoUrl: z.string(),
  thumbnailUrl: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  username: z.string(),
  profileImage: z.string().nullable().optional(),
  viewCount: z.number(),
  likeCount: z.number(),
  saveCount: z.number(),
  isLiked: z.boolean(),
  isSaved: z.boolean(),
});

export const searchVideos = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { query, limit = "10", offset = "0" } = req.query;
    if (!query || query.trim() === "") {
      return getResponseError(res, new ResponseError("Query parameter is required", 400));
    }

    const searchResults = await meilisearch.index("videos").search(query as string, {
      limit: Number(limit),
      offset: Number(offset),
    });

    let videoIdRows = searchResults.hits.map((hit: any) => hit.id);
    if (searchResults.hits.length === 0) {
      const followedUsersVideosId = await db
        .select({ id: videos.id, userId: videos.userId })
        .from(videos)
        .where(
          inArray(
            videos.userId,
            db
              .select({ followedId: followers.followedId })
              .from(followers)
              .where(eq(followers.userId, Number(userId)))
          )
        )
        .orderBy(
          desc(sql`CASE WHEN DATE(${videos.updatedAt}) = CURRENT_DATE THEN 1 ELSE 0 END`),
          desc(videos.viewCount),
          desc(videos.updatedAt),
          desc(sql`(SELECT COUNT(*) FROM ${videoLikes} WHERE ${videoLikes.videoId} = ${videos.id})`)
        )
        .limit(5);

      const videoIds = await db
        .select({ id: videos.id, userId: videos.userId })
        .from(videos)
        .orderBy(
          desc(sql`CASE WHEN DATE(${videos.updatedAt}) = CURRENT_DATE THEN 1 ELSE 0 END`),
          desc(videos.viewCount),
          desc(videos.updatedAt),
          desc(sql`(SELECT COUNT(*) FROM ${videoLikes} WHERE ${videoLikes.videoId} = ${videos.id})`)
        )
        .offset(Number(offset))
        .limit(Number(limit));

      videoIdRows = Array.from(
        new Set([...followedUsersVideosId.map((f) => f.id), ...videoIds.map((f) => f.id)])
      );
    }

    const cachedResults = (await redis.mGet(videoIdRows.map((id) => `videos:${id}`))) as (string | null)[];

    const hits: any[] = [];
    const missedIds: number[] = [];

    cachedResults.forEach((item, idx) => {
      if (item) hits.push(JSON.parse(item));
      else missedIds.push(videoIdRows[idx]);
    });

    let missedVideos: any[] = [];
    if (missedIds.length > 0) {
      const videoRows = await db
        .select({
          id: videos.id,
          userId: videos.userId,
          title: videos.title,
          description: videos.description,
          type: videos.type,
          topic: videos.topic,
          duration: videos.duration,
          videoUrl: videos.videoUrl,
          thumbnailUrl: videos.thumbnailUrl,
          createdAt: videos.createdAt,
          updatedAt: videos.updatedAt,
          username: sql`${users.firstName} || ' ' || ${users.lastName}`,
          profileImage: users.profileImage,
          viewCount: videos.viewCount,
        })
        .from(videos)
        .leftJoin(users, eq(videos.userId, users.id))
        .where(inArray(videos.id, missedIds));

      for (const video of videoRows) {
        const formatted = { ...video };
        missedVideos.push(formatted);
        await redis.set(`videos:${video.id}`, JSON.stringify(formatted), { EX: 600 });
      }
    }

    const allVideosMap = new Map<number, any>();
    for (const video of [...hits, ...missedVideos]) allVideosMap.set(video.id, video);
    const allVideos = videoIdRows.map((id) => allVideosMap.get(id)).filter(Boolean);

    const dynamicData = await db
      .select({
        id: videos.id,
        viewCount: videos.viewCount,
        likeCount: sql`COUNT(DISTINCT ${videoLikes.id})`,
        saveCount: sql`COUNT(DISTINCT ${userSavedVideos.id})`,
        isLiked: sql`CASE WHEN ${videoLikes.videoId} IS NOT NULL THEN true ELSE false END`,
        isSaved: sql`CASE WHEN ${userSavedVideos.videoId} IS NOT NULL THEN true ELSE false END`,
      })
      .from(videos)
      .leftJoin(videoLikes, and(eq(videoLikes.videoId, videos.id), eq(videoLikes.userId, Number(userId))))
      .leftJoin(
        userSavedVideos,
        and(eq(userSavedVideos.videoId, videos.id), eq(userSavedVideos.userId, Number(userId)))
      )
      .where(inArray(videos.id, videoIdRows))
      .groupBy(videos.id, videoLikes.videoId, userSavedVideos.videoId);

    const videosWithMedia = allVideos.map((v) => {
      const dynamic = dynamicData.find((d) => d.id === v.id);
      return {
        ...v,
        viewCount: Number(dynamic?.viewCount ?? 0) + 1,
        likeCount: Number(dynamic?.likeCount) || 0,
        saveCount: Number(dynamic?.saveCount) || 0,
        isLiked: !!dynamic?.isLiked,
        isSaved: !!dynamic?.isSaved,
      };
    });

    const responseBody = VideoSearchItemSchema.array().parse(videosWithMedia);
    return getResponseSuccess(res, responseBody, "Videos fetched successfully", allVideos.length === Number(limit));
  } catch (error) {
    return getResponseError(res, error);
  }
};
