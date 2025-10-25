import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { videos } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const getVideoById = async (id: number) => {
  try {
    const cacheKey = `videos:${id}`;
    const cachedVideo = await redis.get(cacheKey);
    if (cachedVideo) {
      return JSON.parse(cachedVideo);
    }

    const video = await db
      .select()
      .from(videos)
      .where(eq(videos.id, id))
      .groupBy(
        videos.id,
        videos.userId,
        videos.title,
        videos.description,
        videos.viewCount,
        videos.duration
      );

    await redis.set(cacheKey, JSON.stringify(video), { EX: 600 });

    return video;
  } catch (error: any) {
    throw new Error(`Failed to get video: ${error.message}`);
  }
};
