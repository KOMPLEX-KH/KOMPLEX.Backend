import { followers, news, users, userSavedNews } from "@/db/drizzle/schema.js";
import { db } from "@/db/drizzle/index.js";
import { AuthenticatedRequest } from "@/types/request.js";
import { redis } from "@/db/redis/redis.js";
import { newsMedia } from "@/db/drizzle/schema.js";
import { and, sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { Response } from "express";
import { getResponseError, getResponseSuccess } from "@/utils/response.js";
import { FeedNewsItemSchema } from "../get.js";
import { z } from "@/config/openapi/openapi.js";

export const GetNewsByIdParamsSchema = z.object({
  id: z.number(),
}).openapi("GetNewsByIdParams");

export const getNewsById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = GetNewsByIdParamsSchema.parse(req.params);
    const userId = req.user.userId;
    const cacheKey = `news:${id}`;
    const cached = await redis.get(cacheKey);
    let newsData;
    if (cached) {
      newsData = JSON.parse(cached);
    } else {
      newsData = await db
        .select({
          id: news.id,
          userId: news.userId,
          title: news.title,
          description: news.description,
          type: news.type,
          topic: news.topic,
          createdAt: news.createdAt,
          updatedAt: news.updatedAt,
          viewCount: news.viewCount,
          mediaUrl: newsMedia.url,
          mediaType: newsMedia.mediaType,
          username: sql`${users.firstName} || ' ' || ${users.lastName}`,
          profileImage: users.profileImage,
        })
        .from(news)
        .leftJoin(newsMedia, eq(news.id, newsMedia.newsId))
        .leftJoin(users, eq(news.userId, users.id))
        .where(eq(news.id, Number(id)));

      if (!newsData || newsData.length === 0) {
        return res.status(404).json({ error: "Blog not found" });
      }

      newsData = {
        id: newsData[0].id,
        userId: newsData[0].userId,
        title: newsData[0].title,
        description: newsData[0].description,
        type: newsData[0].type,
        topic: newsData[0].topic,
        createdAt: newsData[0].createdAt,
        updatedAt: new Date(),
        username: newsData[0].username,
        profileImage: newsData[0].profileImage,
        media: newsData
          .filter((n: any) => n.mediaUrl)
          .map((n: any) => ({
            url: n.mediaUrl,
            type: n.mediaType,
          })),
      };

      await redis.set(cacheKey, JSON.stringify(newsData), {
        EX: 600,
      });
    }

    await db
      .update(news)
      .set({
        viewCount: sql`${news.viewCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(news.id, Number(id)));

    const dynamic = await db
      .select({
        viewCount: news.viewCount,
        likeCount: news.likeCount,
        isSaved: sql`CASE WHEN ${userSavedNews.newsId} IS NOT NULL THEN true ELSE false END`,
      })
      .from(news)
      .leftJoin(
        userSavedNews,
        and(
          eq(userSavedNews.newsId, news.id),
          eq(userSavedNews.userId, Number(userId))
        )
      )
      .where(eq(news.id, Number(id)));

    const isFollowing = await db
      .select()
      .from(followers)
      .where(
        and(
          eq(followers.followedId, Number(newsData.userId)),
          eq(followers.userId, userId)
        )
      );

    const newsWithMedia = {
      ...newsData,
      isFollowing: isFollowing.length > 0,
      viewCount: dynamic[0]?.viewCount ?? 0,
      likeCount: dynamic[0]?.likeCount ?? 0,
      isSaved: !!dynamic[0]?.isSaved,
    };
    const responseBody = FeedNewsItemSchema.parse(newsWithMedia);
    return getResponseSuccess(res, responseBody, "News fetched successfully");
  } catch (error) {
    return getResponseError(res, error);
  }
};