import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { news, newsMedia, users } from "@/db/schema.js";
import {
  uploadImageToCloudflare,
  deleteFromCloudflare,
} from "@/db/cloudflare/cloudflareFunction.js";
import { redis } from "@/db/redis/redisConfig.js";
import { meilisearch } from "@/config/meilisearchConfig.js";
import crypto from "crypto";

export const updateNews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { title, description, type, topic, photosToRemove } = req.body;

    const doesUserOwnThisNews = await db
      .select()
      .from(news)
      .where(and(eq(news.id, Number(id)), eq(news.userId, Number(userId))))
      .limit(1);
    if (doesUserOwnThisNews.length === 0) {
      throw new ResponseError("News not found", 404);
    }

    let photosToRemoveParse: { url: string }[] = [];
    if (photosToRemove) {
      try {
        photosToRemoveParse = JSON.parse(photosToRemove);
      } catch (err) {
        throw new ResponseError("Invalid photosToRemove format", 400);
      }
    }

    let newNewsMedia: any[] = [];
    if (req.files) {
      for (const file of req.files as Express.Multer.File[]) {
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
                  eq(
                    newsMedia.urlForDeletion,
                    urlForDeletion[0].urlForDeletion
                  )
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

    const meilisearchData = {
      id: newsWithMedia.id,
      title: newsWithMedia.title,
      description: newsWithMedia.description,
      type: newsWithMedia.type,
      topic: newsWithMedia.topic,
    };
    await meilisearch.index("news").addDocuments([meilisearchData]);

    return res.status(200).json(updatedNews);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
