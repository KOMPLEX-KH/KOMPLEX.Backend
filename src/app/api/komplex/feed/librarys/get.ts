import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { books } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

const BOOK_CACHE_PREFIX = "books:";

export const getAllBooks = async (req: Request, res: Response) => {
  try {
    const cacheKey = `${BOOK_CACHE_PREFIX}all`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({ data: JSON.parse(cached) });
    }

    const allBooks = await db.select().from(books);
    await redis.set(cacheKey, JSON.stringify(allBooks), { EX: 60 * 60 });

    return res.status(200).json({ data: allBooks });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

