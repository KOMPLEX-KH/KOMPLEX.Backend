import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { books } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";
import { eq } from "drizzle-orm";

const BOOK_CACHE_PREFIX = "books:";

export const getBookById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cacheKey = `${BOOK_CACHE_PREFIX}${id}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({ data: JSON.parse(cached) });
    }

    const result = await db
      .select()
      .from(books)
      .where(eq(books.id, Number(id)));

    if (!result.length) {
      return getResponseError(res, new ResponseError("Book not found", 404));
    }

    await redis.set(cacheKey, JSON.stringify(result[0]), { EX: 60 * 60 });

    return res.status(200).json({ data: result[0] });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

