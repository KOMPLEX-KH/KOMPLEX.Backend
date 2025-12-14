import { db } from "@/db/index.js";
import { news, users, userSavedNews } from "@/db/schema.js";
import { and, eq } from "drizzle-orm";
import { newsMedia } from "@/db/models/news_medias.js";

export const getAllNews = async (type?: string, topic?: string) => {
  try {
    const conditions = [];
    if (type) conditions.push(eq(news.type, type as string));
    if (topic) conditions.push(eq(news.topic, topic as string));

    const newsFromDb =
      conditions.length > 0
        ? await db
            .select({
              id: news.id,
              userId: news.userId,
              title: news.title,
              description: news.description,
              type: news.type,
              topic: news.topic,
              userFirstName: users.firstName,
              userLastName: users.lastName,
              viewCount: news.viewCount,
              createdAt: news.createdAt,
              updatedAt: news.updatedAt,
            })
            .from(news)
            .where(and(...conditions))
        : await db
            .select({
              id: news.id,
              userId: news.userId,
              title: news.title,
              description: news.description,
              type: news.type,
              topic: news.topic,
              userFirstName: users.firstName,
              userLastName: users.lastName,
              viewCount: news.viewCount,
              createdAt: news.createdAt,
              updatedAt: news.updatedAt,
            })
            .from(news)
            .leftJoin(users, eq(news.userId, users.id))
            .leftJoin(userSavedNews, eq(news.id, userSavedNews.newsId));

    const newsWithMedia = await Promise.all(
      newsFromDb.map(async (newsItem) => {
        const media = await db
          .select()
          .from(newsMedia)
          .where(eq(newsMedia.newsId, newsItem.id));
        return {
          id: newsItem.id,
          userId: newsItem.userId,
          title: newsItem.title,
          description: newsItem.description,
          type: newsItem.type,
          topic: newsItem.topic,
          viewCount: newsItem.viewCount,
          createdAt: newsItem.createdAt,
          updatedAt: newsItem.updatedAt,
          username: `${newsItem.userFirstName} ${newsItem.userLastName}`,
          media: media.map((m) => ({ url: m.url, mediaType: m.mediaType })),
        };
      })
    );

    return newsWithMedia;
  } catch (error) {
    throw new Error(`Failed to get news: ${(error as Error).message}`);
  }
};

export const postNews = async (
  userId: number,
  title: string,
  description: string,
  type?: string,
  topic?: string,
  publicUrl?: string,
  mediaType?: "image" | "video"
) => {
  try {
    if (!userId || !title || !description) {
      throw new Error("Missing required fields");
    }

    const newNews = await db
      .insert(news)
      .values({
        userId: Number(userId),
        title,
        description,
        type,
        topic,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (publicUrl) {
      await db.insert(newsMedia).values({
        newsId: newNews[0].id,
        url: publicUrl,
        mediaType: mediaType,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return newNews[0];
  } catch (error) {
    throw new Error(`Failed to create news: ${(error as Error).message}`);
  }
};
