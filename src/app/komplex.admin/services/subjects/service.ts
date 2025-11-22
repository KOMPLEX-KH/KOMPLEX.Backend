import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { exercises, subjects } from "@/db/schema.js";

export const getSubjects = async () => {
  try {
    const cacheKey = `allSubjects`;
    const cacheData = await redis.get(cacheKey);
    if (cacheData) {
      return JSON.parse(cacheData);
    }
    const result = await db
      .select({
        subject: subjects.name,
      })
      .from(subjects);
    await redis.set(cacheKey, JSON.stringify(result), { EX: 60 * 60 * 24 });
    return result;
  } catch (error) {
    throw new Error(`Failed to get subjects: ${(error as Error).message}`);
  }
};
