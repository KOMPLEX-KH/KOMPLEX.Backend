import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { videos } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const getVideoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cacheKey = `videos:${id}`;
    const cachedVideo = await redis.get(cacheKey);
    if (cachedVideo) {
      return res.status(200).json(JSON.parse(cachedVideo));
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

    return res.status(200).json(video);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
