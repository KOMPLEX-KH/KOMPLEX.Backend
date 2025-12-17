import { db } from "@/db/index.js";
import {
  news,
  newsMedia,
  users,
  followers,
  userSavedNews,
} from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";
import { eq, and, sql } from "drizzle-orm";

export const getNewsById = async (id: string, userId: number) => {
  const cacheKey = `news:${id}`;

  // Try Redis first (only static info)
  const cached = await redis.get(cacheKey);
  let newsData;
  if (cached) {
    newsData = JSON.parse(cached);
  } else {
    // Fetch blog static info
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
      throw new Error("Blog not found");
    }

    // Build static cacheable object
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
        .filter((n) => n.mediaUrl)
        .map((n) => ({
          url: n.mediaUrl,
          type: n.mediaType,
        })),
    };

    // Cache static data only
    await redis.set(cacheKey, JSON.stringify(newsData), {
      EX: 600, // 10 minutes
    });
  }

  // Always increment view count on every request
  await db
    .update(news)
    .set({
      viewCount: sql`${news.viewCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(news.id, Number(id)));

  // Always fetch dynamic fields fresh
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
    viewCount: dynamic[0]?.viewCount ?? 0, // Use the fresh viewCount from database
    likeCount: dynamic[0]?.likeCount ?? 0,
    isSaved: !!dynamic[0]?.isSaved,
  };

  return { data: newsWithMedia };
};
