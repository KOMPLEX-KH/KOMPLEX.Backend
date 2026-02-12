import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { books } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";
import { eq } from "drizzle-orm";

const BOOK_CACHE_PREFIX = "books:";

export const getBooksByLesson = async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;
    const cacheKey = `${BOOK_CACHE_PREFIX}lesson:${lessonId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.status(200).json({ data: JSON.parse(cached) });
    }

    const result = await db
      .select()
      .from(books)
      .where(eq(books.lessonId, Number(lessonId)));
    await redis.set(cacheKey, JSON.stringify(result), { EX: 60 * 30 });

    return res.status(200).json({ data: result });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

