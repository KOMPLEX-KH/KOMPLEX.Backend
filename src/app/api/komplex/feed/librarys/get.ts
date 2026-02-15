import { Request, Response } from "express";
import { getResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { books } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { z } from "@/config/openapi/openapi.js";

const BOOK_CACHE_PREFIX = "books:";

const BookItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  fileUrl: z.string().nullable().optional(),
  fileKey: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  coverKey: z.string().nullable().optional(),
  subjectId: z.number().nullable().optional(),
  lessonId: z.number().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const FeedBooksResponseSchema = z
  .object({
    data: z.array(BookItemSchema),
  })
  .openapi("FeedBooksResponse");

export const getAllBooks = async (req: Request, res: Response) => {
  try {
    const cacheKey = `${BOOK_CACHE_PREFIX}all`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      const responseBody = FeedBooksResponseSchema.parse({
        data: JSON.parse(cached),
      });
      return res.status(200).json(responseBody);
    }

    const allBooks = await db.select().from(books);
    await redis.set(cacheKey, JSON.stringify(allBooks), { EX: 60 * 60 });

    const responseBody = FeedBooksResponseSchema.parse({ data: allBooks });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

