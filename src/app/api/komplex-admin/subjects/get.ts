import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { subjects } from "@/db/schema.js";

export const getSubjects = async (req: Request, res: Response) => {
  try {
    const cacheKey = `allSubjects`;
    const cacheData = await redis.get(cacheKey);
    if (cacheData) {
      return res.status(200).json(JSON.parse(cacheData));
    }

    const result = await db
      .select({
        subject: subjects.name,
      })
      .from(subjects);

    await redis.set(cacheKey, JSON.stringify(result), { EX: 60 * 60 * 24 });
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
