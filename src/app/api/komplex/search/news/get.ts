import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { newsMedia } from "@/db/models/news_medias.js";
import { news } from "@/db/models/news.js";
import { redis } from "@/db/redis/redisConfig.js";
import { followers, users, userSavedNews } from "@/db/schema.js";
import { meilisearch } from "@/config/meilisearch/meilisearchConfig.js";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

export const searchNews = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { query, limit = "10", offset = "0" } = req.query;
    if (!query || query.trim() === "") {
      return getResponseError(res, new ResponseError("Query parameter is required", 400));
    }

    const searchResults = await meilisearch.index("news").search(query as string, {
      limit: Number(limit),
      offset: Number(offset),
    });
    let idsFromSearch = searchResults.hits.map((hit: any) => hit.id);
    if (searchResults.hits.length === 0) {
      const followedUsersNewsId = await db
        .select({ id: news.id, userId: news.userId })
        .from(news)
        .where(
          inArray(
            news.userId,
            db
              .select({ followedId: followers.followedId })
              .from(followers)
              .where(eq(followers.userId, Number(userId)))
          )
        )
        .orderBy(
          desc(
            sql`CASE WHEN DATE(${news.updatedAt}) = CURRENT_DATE THEN 1 ELSE 0 END`
          ),
          desc(news.likeCount),
          desc(news.updatedAt)
        )
        .limit(5);

      const newsIds = await db
        .select({ id: news.id, userId: news.userId })
        .from(news)
        .orderBy(
          desc(
            sql`CASE WHEN DATE(${news.updatedAt}) = CURRENT_DATE THEN 1 ELSE 0 END`
          ),
          desc(news.likeCount),
          desc(news.updatedAt)
        )
        .offset(Number(offset))
        .limit(Number(limit));

      idsFromSearch = Array.from(
        new Set([
          ...followedUsersNewsId.map((f) => f.id),
          ...newsIds.map((f) => f.id),
        ])
      );
    }
    const cachedResults = (await redis.mGet(
      idsFromSearch.map((id) => `news:${id}`)
    )) as (string | null)[];
    const hits: any[] = [];
    const missedIds: number[] = [];

    if (cachedResults.length > 0) {
      cachedResults.forEach((item, idx) => {
        if (item) hits.push(JSON.parse(item));
        else missedIds.push(idsFromSearch[idx]);
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
        await redis.set(`news:${newsItem.id}`, JSON.stringify(newsItem), { EX: 600 });
      }
    }

    const allNewsMap = new Map<number, any>();
    for (const newsItem of [...hits, ...missedNews]) allNewsMap.set(newsItem.id, newsItem);
    const allNews = idsFromSearch.map((id) => allNewsMap.get(id));

    const dynamicData = await db
      .select({
        id: news.id,
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
      .where(
        inArray(
          news.id,
          idsFromSearch.map((b) => b.id)
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

    return res.status(200).json({
      data: newsWithMedia,
      hasMore: allNews.length === Number(limit),
      isMatch: searchResults.hits.length > 0,
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
