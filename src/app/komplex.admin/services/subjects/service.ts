import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { exercises } from "@/db/schema.js";

export const getSubjects = async () => {
  try {
    const cacheKey = `allSubjects`;
    const cacheData = await redis.get(cacheKey);
    if (cacheData) {
      return JSON.parse(cacheData);
    }
    const result = await db
      .select({
        subject: exercises.subject,
      })
      .from(exercises);
    const subjects = [...new Set(result.map((item) => item.subject))];
    await redis.set(cacheKey, JSON.stringify(subjects), { EX: 60 * 60 * 24 });
    return subjects;
  } catch (error) {
    throw new Error(`Failed to get subjects: ${(error as Error).message}`);
  }
};
