import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { news, newsMedia, userSavedNews } from "@/db/schema.js";
import { deleteFromCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { redis } from "@/db/redis/redisConfig.js";
import { meilisearch } from "@/config/meilisearch/meilisearchConfig.js";
import { z } from "@/config/openapi/openapi.js";

export const AdminDeleteNewsParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("AdminDeleteNewsParams");

export const AdminDeleteNewsResponseSchema = z
  .array(z.any())
  .openapi("AdminDeleteNewsResponse");

export const deleteNews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = await AdminDeleteNewsParamsSchema.parseAsync(req.params);
    const { userId } = req.user;

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

    const deletedMedia = await db
      .delete(newsMedia)
      .where(eq(newsMedia.newsId, Number(id)))
      .returning();

    await db.delete(userSavedNews).where(eq(userSavedNews.newsId, Number(id)));

    const deletedNews = await db
      .delete(news)
      .where(eq(news.id, Number(id)))
      .returning();

    await redis.del(`news:${id}`);
    await redis.del(`dashboardData:${userId}`);

    await meilisearch.index("news").deleteDocument(String(id));

    const responseBody = AdminDeleteNewsResponseSchema.parse(deletedNews);

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
