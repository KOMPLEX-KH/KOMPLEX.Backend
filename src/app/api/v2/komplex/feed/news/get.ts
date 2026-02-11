import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { and, eq, desc, sql, inArray } from "drizzle-orm";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import {
  news,
  newsMedia,
  followers,
  users,
  userSavedNews,
} from "@/db/schema.js";
import { ResponseError } from "@/utils/responseError.js";
import { getResponseError } from "@/utils/responseError.js";

export const getAllNews = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { type, topic, page } = req.query;

    const conditions = [];
    if (type) conditions.push(eq(news.type, type as string));
    if (topic) conditions.push(eq(news.topic, topic as string));

    const pageNumber = Number(page) || 1;
    const limit = 20;
    const offset = (pageNumber - 1) * limit;

    let followedUsersNewsId: { id: number; userId: number | null }[] = [];
    if (userId && Number(userId) > 0) {
      const followedIds = await db
        .select({ followedId: followers.followedId })
        .from(followers)
        .where(eq(followers.userId, Number(userId)));
      if (followedIds.length > 0) {
        const validFollowedIds = followedIds
          .map((f) => f.followedId)
          .filter((id): id is number => id !== null && id !== undefined);
        if (validFollowedIds.length > 0) {
          followedUsersNewsId = await db
            .select({ id: news.id, userId: news.userId })
            .from(news)
            .where(inArray(news.userId, validFollowedIds))
            .orderBy(
              desc(
                sql`CASE WHEN DATE(${news.updatedAt}) = CURRENT_DATE THEN 1 ELSE 0 END`
              ),
              desc(news.likeCount),
              desc(news.updatedAt)
            )
            .limit(5);
        }
      }
    }

    const newsIds = await db
      .select({ id: news.id, userId: news.userId })
      .from(news)
      .where(
        conditions.length > 0 ? and(...conditions) : undefined
      )
      .orderBy(
        desc(
          sql`CASE WHEN DATE(${news.updatedAt}) = CURRENT_DATE THEN 1 ELSE 0 END`
        ),
        desc(news.likeCount),
        desc(news.updatedAt)
      )
      .offset(offset)
      .limit(limit);

    const newsIdRows = Array.from(
      Array.from(
        new Set([
          ...followedUsersNewsId.map((f) => f.id),
          ...newsIds.map((f) => f.id),
        ])
      ).map((id) => ({
        id,
      }))
    );

    if (!newsIdRows.length) {
      return res.status(200).json({ data: [], hasMore: false });
    }

    const cachedResults = (await redis.mGet(
      newsIdRows.map((b) => `news:${b.id}`)
    )) as (string | null)[];

    const hits: any[] = [];
    const missedIds: number[] = [];

    if (cachedResults.length > 0) {
      cachedResults.forEach((item, idx) => {
        if (item) hits.push(JSON.parse(item));
        else missedIds.push(newsIdRows[idx].id);
      });
    }

    let missedNews: any[] = [];
    if (missedIds.length > 0) {
      const newsRows = await db
        .select({
          id: news.id,
          userId: news.userId,
          title: news.title,
          description: news.description,
          type: news.type,
          topic: news.topic,
          createdAt: news.createdAt,
          updatedAt: news.updatedAt,
          mediaUrl: newsMedia.url,
          mediaType: newsMedia.mediaType,
          username: sql`${users.firstName} || ' ' || ${users.lastName}`,
          profileImage: users.profileImage,
        })
        .from(news)
        .leftJoin(newsMedia, eq(news.id, newsMedia.newsId))
        .leftJoin(users, eq(news.userId, users.id))
        .where(inArray(news.id, missedIds));

      const newsMap = new Map<number, any>();
      for (const newsItem of newsRows) {
        if (!newsMap.has(newsItem.id)) {
          const formatted = {
            id: newsItem.id,
            userId: newsItem.userId,
            title: newsItem.title,
            description: newsItem.description,
            type: newsItem.type,
            topic: newsItem.topic,
            createdAt: newsItem.createdAt,
            updatedAt: newsItem.updatedAt,
            username: newsItem.username,
            profileImage: newsItem.profileImage,
            media: [] as { url: string; type: string }[],
          };
          newsMap.set(newsItem.id, formatted);
          missedNews.push(formatted);
        }

        if (newsItem.mediaUrl) {
          newsMap.get(newsItem.id).media.push({
            url: newsItem.mediaUrl,
            type: newsItem.mediaType,
          });
        }
      }

      for (const newsItem of missedNews) {
        await redis.set(`news:${newsItem.id}`, JSON.stringify(newsItem), {
          EX: 600,
        });
      }
    }

    const allNewsMap = new Map<number, any>();
    for (const newsItem of [...hits, ...missedNews])
      allNewsMap.set(newsItem.id, newsItem);
    const allNews = newsIdRows.map((b) => allNewsMap.get(b.id));

    const dynamicData = await db
      .select({
        id: news.id,
        viewCount: news.viewCount,
        likeCount: news.likeCount,
        isSaved:
          userId && Number(userId) > 0
            ? sql`CASE WHEN ${userSavedNews.newsId} IS NOT NULL THEN true ELSE false END`
            : sql`false`,
      })
      .from(news)
      .leftJoin(
        userSavedNews,
        userId && Number(userId) > 0
          ? and(
              eq(userSavedNews.newsId, news.id),
              eq(userSavedNews.userId, Number(userId))
            )
          : undefined
      )
      .where(
        inArray(
          news.id,
          newsIdRows.map((b) => b.id)
        )
      );

    const newsWithMedia = allNews.map((b) => {
      const dynamic = dynamicData.find((d) => d.id === b.id);
      return {
        ...b,
        viewCount: dynamic?.viewCount ?? 0,
        likeCount: dynamic?.likeCount ?? 0,
        isSaved: !!dynamic?.isSaved,
      };
    });

    const newsUserIdRows = Array.from(
      Array.from(
        new Set([
          ...followedUsersNewsId.map((f) => f.userId),
          ...newsIds.map((f) => f.userId),
        ])
      ).map((id) => ({
        userId: id,
      }))
    );

    const newsWithMediaAndIsFollowing = newsWithMedia.map((newsItem) => ({
      ...newsItem,
      isFollowing: newsUserIdRows.some((b) => b.userId === newsItem.userId),
    }));

    return res.status(200).json({
      data: newsWithMediaAndIsFollowing,
      hasMore: allNews.length === limit,
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
