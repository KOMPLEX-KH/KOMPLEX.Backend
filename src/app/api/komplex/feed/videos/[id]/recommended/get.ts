import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { videos, users, userSavedVideos, videoLikes } from "@/db/drizzle/schema.js";
import { meilisearch } from "@/config/meilisearch/meilisearchConfig.js";
import { getResponseError, getResponseSuccess } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

export const RecommendedVideosItemSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  duration: z.number().nullable().optional(),
  videoUrl: z.string(),
  thumbnailUrl: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  username: z.string(),
  profileImage: z.string().nullable().optional(),
  viewCount: z.number(),
  likeCount: z.number(),
  saveCount: z.number(),
  isLiked: z.boolean(),
  isSaved: z.boolean(),
}).openapi("RecommendedVideosItemSchema");

export const getRecommendedVideos = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { limit, offset } = req.query;
    const { id } = req.params;
    const videoId = Number(id);
    const limitNum = Number(limit) || 10;
    const offsetNum = Number(offset) || 0;

    const cacheVideoKey = `video:${videoId}`;
    let query = "";

    const cacheVideoData = await redis.get(cacheVideoKey);
    let baseVideo: any;

    if (cacheVideoData) {
      baseVideo = JSON.parse(cacheVideoData);
      query = `${baseVideo.title} ${baseVideo.description} ${baseVideo.topic} ${baseVideo.type}`;
    } else {
      const [videoRow] = await db
        .select({
          id: videos.id,
          userId: videos.userId,
          title: videos.title,
          topic: videos.topic,
          type: videos.type,
          description: videos.description,
        })
        .from(videos)
        .where(eq(videos.id, videoId));

      if (!videoRow) {
        return getResponseSuccess(res, [], "Video not found", false);
      }

      baseVideo = videoRow;
      query = `${videoRow.title} ${videoRow.description} ${videoRow.topic} ${videoRow.type}`;
      await redis.set(cacheVideoKey, JSON.stringify(videoRow), { EX: 600 });
    }

    const searchResults = await meilisearch.index("videos").search(query, {
      limit: limitNum,
      offset: offsetNum,
    });
    const videoIdRows: number[] = searchResults.hits.map((hit: any) => hit.id);

    const cachedResults = (await redis.mGet(
      videoIdRows.map((id) => `videos:${id}`)
    )) as (string | null)[];

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
        missedVideos.push(video);
        await redis.set(`videos:${video.id}`, JSON.stringify(video), {
          EX: 600,
        });
      }
    }

    const allVideosMap = new Map<number, any>();
    for (const video of [...hits, ...missedVideos])
      allVideosMap.set(video.id, video);
    const allVideos = videoIdRows
      .map((id) => allVideosMap.get(id))
      .filter(Boolean);

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
      .leftJoin(
        videoLikes,
        and(
          eq(videoLikes.videoId, videos.id),
          eq(videoLikes.userId, Number(userId))
        )
      )
      .leftJoin(
        userSavedVideos,
        and(
          eq(userSavedVideos.videoId, videos.id),
          eq(userSavedVideos.userId, Number(userId))
        )
      )
      .where(inArray(videos.id, videoIdRows))
      .groupBy(videos.id, videoLikes.videoId, userSavedVideos.videoId);

    const videosWithMedia = allVideos.map((v) => {
      const dynamic = dynamicData.find((d) => d.id === v.id);
      return RecommendedVideosItemSchema.parse({
        ...v,
        viewCount: Number(dynamic?.viewCount ?? 0) + 1,
        likeCount: Number(dynamic?.likeCount) || 0,
        saveCount: Number(dynamic?.saveCount) || 0,
        isLiked: !!dynamic?.isLiked,
        isSaved: !!dynamic?.isSaved,
      });
    });

    return getResponseSuccess(res, videosWithMedia, "Recommended videos fetched successfully", allVideos.length === limitNum);
  } catch (error) {
    return getResponseError(res, error);
  }
};
