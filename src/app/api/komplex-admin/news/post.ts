import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { news, users } from "@/db/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { newsMedia } from "@/db/drizzle/models/news_medias.js";
import { uploadImageToCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { redis } from "@/db/redis/redis.js";
import { meilisearch } from "@/config/meilisearch/meilisearchConfig.js";
import crypto from "crypto";

import { z } from "@/config/openapi/openapi.js";

export const AdminPostNewsBodySchema = z
  .object({
    title: z.string(),
    description: z.string(),
    type: z.string().optional(),
    topic: z.string().optional(),
  })
  .openapi("AdminPostNewsBody");

export const AdminPostNewsResponseSchema = z
  .object({
    success: z.literal(true),
    newNews: z.any(),
    newNewsMedia: z.array(z.any()),
  })
  .openapi("AdminPostNewsResponse");

export const postNews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const { title, description, type, topic } = await AdminPostNewsBodySchema.parseAsync(req.body);

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

    let newNewsMedia: any[] = [];
    if (req.files) {
      for (const file of req.files as Express.Multer.File[]) {
        try {
          const uniqueKey = `${newNews.id}-${crypto.randomUUID()}-${file.originalname
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

    const meilisearchData = {
      id: newsWithMedia.id,
      title: newsWithMedia.title,
      description: newsWithMedia.description,
      type: newsWithMedia.type,
      topic: newsWithMedia.topic,
    };
    await meilisearch.index("news").addDocuments([meilisearchData]);

    const redisKey = `news:${newNews.id}`;
    await redis.set(redisKey, JSON.stringify(newsWithMedia), { EX: 600 });
    await redis.del(`dashboardData:${userId}`);

    return res.status(201).json(AdminPostNewsResponseSchema.parse({ success: true, newNews, newNewsMedia }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
