import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { grades } from "@/db/schema.js";

export const getGrades = async (req: Request, res: Response) => {
  try {
    const cacheKey = `allGrades`;
    const cacheData = await redis.get(cacheKey);
    if (cacheData) {
      return res.status(200).json(JSON.parse(cacheData));
    }

    const result = await db
      .select({
        grade: grades.name,
      })
      .from(grades);

    await redis.set(cacheKey, JSON.stringify(result), { EX: 60 * 60 * 24 });
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
