import { Request, Response } from "express";
import { getResponseError } from "@/utils/response.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle/index.js";
import { videos } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { z } from "@/config/openapi/openapi.js";

export const AdminGetVideoByIdParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("AdminGetVideoByIdParams");

export const AdminGetVideoByIdResponseSchema = z
  .array(z.any())
  .openapi("AdminGetVideoByIdResponse");

export const getVideoById = async (req: Request, res: Response) => {
  try {
    const { id } = await AdminGetVideoByIdParamsSchema.parseAsync(req.params);
    const cacheKey = `videos:${id}`;
    const cachedVideo = await redis.get(cacheKey);
    if (cachedVideo) {
      const parsed = AdminGetVideoByIdResponseSchema.parse(
        JSON.parse(cachedVideo)
      );
      return res.status(200).json(parsed);
    }

    const video = await db
      .select()
      .from(videos)
      .where(eq(videos.id, Number(id)))
      .groupBy(
        videos.id,
        videos.userId,
        videos.title,
        videos.description,
        videos.viewCount,
        videos.duration
      );

    await redis.set(cacheKey, JSON.stringify(video), { EX: 600 });

    const responseBody = AdminGetVideoByIdResponseSchema.parse(video);

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
