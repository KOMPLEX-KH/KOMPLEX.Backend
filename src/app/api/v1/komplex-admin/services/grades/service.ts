import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { exercises, grades } from "@/db/schema.js";

export const getGrades = async () => {
  try {
    const cacheKey = `allGrades`;
    const cacheData = await redis.get(cacheKey);
    if (cacheData) {
      return JSON.parse(cacheData);
    }
    const result = await db
      .select({
        grade: grades.name,
      })
      .from(grades);
    await redis.set(cacheKey, JSON.stringify(result), { EX: 60 * 60 * 24 });
    return result;
  } catch (error) {
    throw new Error(`Failed to get grades: ${(error as Error).message}`);
  }
};
