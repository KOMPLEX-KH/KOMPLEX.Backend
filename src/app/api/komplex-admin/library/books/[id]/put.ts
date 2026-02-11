import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { books } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";
import { eq } from "drizzle-orm";

const BOOK_CACHE_PREFIX = "book:";

export const updateBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new ResponseError("Invalid ID parameter", 400);
    }

    const payload = req.body as any;

    const result = await db
      .update(books)
      .set({
        ...payload,
        publishedDate: payload.publishedDate
          ? typeof payload.publishedDate === "string"
            ? payload.publishedDate
            : payload.publishedDate instanceof Date
              ? payload.publishedDate.toISOString().split("T")[0]
              : payload.publishedDate
          : undefined,
        updatedAt: new Date(),
      })
      .where(eq(books.id, Number(id)))
      .returning();

    if (result.length === 0) {
      throw new ResponseError("Book not found", 404);
    }

    await redis.del(`${BOOK_CACHE_PREFIX}${id}`);
    await redis.del("books:all");

    return res.status(200).json({ data: result[0] });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

