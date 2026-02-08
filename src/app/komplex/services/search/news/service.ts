import { db } from "@/db/index.js";
import { newsMedia } from "@/db/models/news_medias.js";
import { news } from "@/db/models/news.js";
import { redis } from "@/db/redis/redisConfig.js";
import { followers, users, userSavedNews } from "@/db/schema.js";
import { meilisearch } from "@/config/meilisearchConfig.js";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { ResponseError } from "@/utils/responseError.js";

export const searchNews = async (
  query: string,
  limit: number,
  offset: number,
  userId: number
) => {
  try {
    const searchResults = await meilisearch.index("news").search(query, {
      limit,
      offset,
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

      // 1️⃣ Fetch filtered blog IDs from DB (including your own blogs) might change to other user's blogs only in the future
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
        .offset(offset)
        .limit(limit);

      idsFromSearch = Array.from(
        Array.from(
          new Set([
            ...followedUsersNewsId.map((f) => f.id),
            ...newsIds.map((f) => f.id),
          ])
        )
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

    // 3️⃣ Fetch missing blogs from DB
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
      for (const news of newsRows) {
        if (!newsMap.has(news.id)) {
          const formatted = {
            id: news.id,
            userId: news.userId,
            title: news.title,
            description: news.description,
            type: news.type,
            topic: news.topic,
            createdAt: news.createdAt,
            updatedAt: news.updatedAt,
            username: news.username,
            profileImage: news.profileImage,
            media: [] as { url: string; type: string }[],
          };
          newsMap.set(news.id, formatted);
          missedNews.push(formatted);
        }

        if (news.mediaUrl) {
          newsMap.get(news.id).media.push({
            url: news.mediaUrl,
            type: news.mediaType,
          });
        }
      }

      // Write missed blogs to Redis
      for (const news of missedNews) {
        await redis.set(`news:${news.id}`, JSON.stringify(news), { EX: 600 });
      }
    }

    // 4️⃣ Merge hits and missed blogs, preserving original order
    const allNewsMap = new Map<number, any>();
    for (const news of [...hits, ...missedNews]) allNewsMap.set(news.id, news);
    const allNews = idsFromSearch.map((id) => allNewsMap.get(id));

    // 5️⃣ Fetch dynamic fields fresh
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

    return {
      data: newsWithMedia,
      hasMore: allNews.length === limit,
      isMatch: searchResults.hits.length > 0,
    };
  } catch (err: any) {
    throw new ResponseError(err as string, 500);
  }
};
