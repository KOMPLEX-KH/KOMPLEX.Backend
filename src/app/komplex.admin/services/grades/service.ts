import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { exercises } from "@/db/schema.js";

export const getGrades = async () => {
  try {
    const cacheKey = `allGrades`;
    const cacheData = await redis.get(cacheKey);
    if (cacheData) {
      return JSON.parse(cacheData);
    }
    const result = await db
      .select({
        grade: exercises.grade,
      })
      .from(exercises);
    const grades = [...new Set(result.map((item) => item.grade))];
    await redis.set(cacheKey, JSON.stringify(grades), { EX: 60 * 60 * 24 });
    return grades;
  } catch (error) {
    throw new Error(`Failed to get grades: ${(error as Error).message}`);
  }
};
