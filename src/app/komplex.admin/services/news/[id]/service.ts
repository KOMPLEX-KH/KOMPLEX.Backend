import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { news, newsMedia, users, userSavedNews } from "@/db/schema.js";
import {
  uploadImageToCloudflare,
  deleteFromCloudflare,
} from "@/db/cloudflare/cloudflareFunction.js";
import { redis } from "@/db/redis/redisConfig.js";
import { meilisearch } from "@/config/meilisearchConfig.js";

export const getNewsById = async (id: number) => {
  try {
    const newsItem = await db
      .select()
      .from(news)
      .where(eq(news.id, id))
      .limit(1);

    if (!newsItem || newsItem.length === 0 || !newsItem[0]) {
      throw new Error("News not found");
    }

    // Update view count
    await db
      .update(news)
      .set({
        viewCount: (newsItem[0]?.viewCount ?? 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(news.id, id))
      .returning();

    return newsItem[0];
  } catch (error) {
    throw new Error(`Failed to get news: ${(error as Error).message}`);
  }
};

export const updateNews = async (
  id: string,
  body: any,
  files: any,
  userId: number
) => {
  const { title, description, type, topic, photosToRemove } = body;

  const doesUserOwnThisNews = await db
    .select()
    .from(news)
    .where(and(eq(news.id, Number(id)), eq(news.userId, Number(userId))))
    .limit(1);
  if (doesUserOwnThisNews.length === 0) {
    throw new Error("News not found");
  }

  let photosToRemoveParse: { url: string }[] = [];
  if (photosToRemove) {
    try {
      photosToRemoveParse = JSON.parse(photosToRemove);
    } catch (err) {
      console.error("Error parsing photosToRemove:", err);
      throw new Error("Invalid photosToRemove format");
    }
  }
  let newNewsMedia: any[] = [];
  if (files) {
    for (const file of files as Express.Multer.File[]) {
      try {
        const uniqueKey = `${id}-${crypto.randomUUID()}-${file.originalname}`;
        const url = await uploadImageToCloudflare(
          uniqueKey,
          file.buffer,
          file.mimetype
        );
        const [newMedia] = await db
          .insert(newsMedia)
          .values({
            newsId: Number(id),
            url: url,
            urlForDeletion: uniqueKey,
            mediaType: "image",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        newNewsMedia.push(newMedia);
      } catch (error) {
        console.error("Error uploading file or saving media:", error);
      }
    }
  }

  let deleteMedia = null;
  if (photosToRemoveParse && photosToRemoveParse.length > 0) {
    const deleteResults = await Promise.all(
      photosToRemoveParse.map(async (photoToRemove: any) => {
        const urlForDeletion = await db
          .select({
            urlForDeletion: newsMedia.urlForDeletion,
          })
          .from(newsMedia)
          .where(eq(newsMedia.url, photoToRemove.url));
        let deleted = null;
        if (urlForDeletion[0]?.urlForDeletion) {
          await deleteFromCloudflare(
            "komplex-image",
            urlForDeletion[0].urlForDeletion
          );
          deleted = await db
            .delete(newsMedia)
            .where(
              and(
                eq(newsMedia.newsId, Number(id)),
                eq(newsMedia.urlForDeletion, urlForDeletion[0].urlForDeletion)
              )
            )
            .returning();
        }
        return deleted;
      })
    );

    deleteMedia = deleteResults.flat();
  }

  const updatedNews = await db
    .update(news)
    .set({
      title,
      description,
      type,
      topic,
      updatedAt: new Date(),
    })
    .where(eq(news.id, Number(id)))
    .returning();

  const newsItem = await db
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
    })
    .from(news)
    .leftJoin(newsMedia, eq(news.id, newsMedia.newsId))
    .leftJoin(users, eq(news.userId, users.id))
    .where(eq(news.id, Number(id)));

  const newsWithMedia = {
    id: newsItem[0].id,
    userId: newsItem[0].userId,
    title: newsItem[0].title,
    description: newsItem[0].description,
    type: newsItem[0].type,
    topic: newsItem[0].topic,
    createdAt: newsItem[0].createdAt,
    updatedAt: newsItem[0].updatedAt,
    username: newsItem[0]?.username,
    media: newsItem
      .filter((n) => n.mediaUrl)
      .map((n) => ({
        url: n.mediaUrl,
        type: n.mediaType,
      })),
  };

  await redis.set(`news:${id}`, JSON.stringify(newsWithMedia), { EX: 600 });
  await redis.del(`dashboardData:${userId}`);
  const myNewsKeys: string[] = await redis.keys(
    `myNews:${userId}:type:*:topic:*`
  );

  if (myNewsKeys.length > 0) {
    await redis.del(myNewsKeys);
  }

  const meilisearchData = {
    id: newsWithMedia.id,
    title: newsWithMedia.title,
    description: newsWithMedia.description,
    type: newsWithMedia.type,
    topic: newsWithMedia.topic,
  };
  await meilisearch.index("news").addDocuments([meilisearchData]);

  return { data: updatedNews, newNewsMedia };
};

export const deleteNews = async (id: string, userId: number) => {
  const mediaToDelete = await db
    .select({
      urlToDelete: newsMedia.urlForDeletion,
    })
    .from(newsMedia)
    .where(eq(newsMedia.newsId, Number(id)));

  if (mediaToDelete && mediaToDelete.length > 0) {
    await Promise.all(
      mediaToDelete.map((media) =>
        deleteFromCloudflare("komplex-image", media.urlToDelete ?? "")
      )
    );
  }

  // Delete associated media from DB
  const deletedMedia = await db
    .delete(newsMedia)
    .where(eq(newsMedia.newsId, Number(id)))
    .returning();

  // Step 3: Delete news saves
  await db.delete(userSavedNews).where(eq(userSavedNews.newsId, Number(id)));

  // Step 4: Delete news itself
  const deletedNews = await db
    .delete(news)
    .where(eq(news.id, Number(id)))
    .returning();

  await redis.del(`news:${id}`);
  await redis.del(`dashboardData:${userId}`);
  const redisKey = `userNews:${userId}:type:*:topic:*:page:*`;
  const myNewsKeys: string[] = await redis.keys(redisKey);
  if (myNewsKeys.length > 0) {
    await redis.del(myNewsKeys);
  }

//   await meilisearch.index("news").deleteDocument(String(id));
  return {
    data: deletedNews,
  };
};
