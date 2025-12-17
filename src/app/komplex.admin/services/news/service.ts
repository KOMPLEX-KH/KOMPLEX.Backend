import { db } from "@/db/index.js";
import { news, users, userSavedNews } from "@/db/schema.js";
import { and, eq } from "drizzle-orm";
import { newsMedia } from "@/db/models/news_medias.js";
import { uploadImageToCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { redis } from "@/db/redis/redisConfig.js";
import crypto from "crypto";

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

export const postNews = async (body: any, files: any, userId: number) => {
  const { title, description, type, topic } = body;

  if (!userId || !title || !description) {
    throw new Error("Missing required fields");
  }

  // Insert news
  const [newNews] = await db
    .insert(news)
    .values({
      userId: Number(userId),
      title,
      description,
      type,
      topic,
      viewCount: 0,
      likeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Insert news media if uploaded
  let newNewsMedia: any[] = [];
  if (files) {
    for (const file of files as Express.Multer.File[]) {
      try {
        const uniqueKey = `${newNews.id}-${crypto.randomUUID()}-${
          file.originalname
        }`;
        const url = await uploadImageToCloudflare(
          uniqueKey,
          file.buffer,
          file.mimetype
        );
        const [media] = await db
          .insert(newsMedia)
          .values({
            newsId: newNews.id,
            url: url,
            urlForDeletion: uniqueKey,
            mediaType: file.mimetype.startsWith("video") ? "video" : "image",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        newNewsMedia.push(media);
      } catch (error) {
        console.error("Error uploading file or saving media:", error);
      }
    }
  }

  const [userData] = await db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
      profileImage: users.profileImage,
    })
    .from(users)
    .where(eq(users.id, Number(userId)));

  const newsWithMedia = {
    id: newNews.id,
    userId: newNews.userId,
    title: newNews.title,
    description: newNews.description,
    type: newNews.type,
    topic: newNews.topic,
    viewCount: newNews.viewCount,
    likeCount: newNews.likeCount,
    createdAt: newNews.createdAt,
    updatedAt: newNews.updatedAt,
    username: userData.firstName + " " + userData.lastName,
    profileImage: userData.profileImage,
    isSaved: false,
    media: newNewsMedia.map((m) => ({
      url: m.url,
      type: m.mediaType,
    })),
  };

  const redisKey = `news:${newNews.id}`;
  await redis.set(redisKey, JSON.stringify(newsWithMedia), { EX: 600 });
  await redis.del(`dashboardData:${userId}`);
  // Delete all user news cache keys for this user regardless of type or topic
  const myNewsKeys: string[] = await redis.keys(
    `myNews:${userId}:type:*:topic:*`
  );
  if (myNewsKeys.length > 0) {
    await redis.del(myNewsKeys);
  }

  return { data: { success: true, newNews, newNewsMedia } };
};
