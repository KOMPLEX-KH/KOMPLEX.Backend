import { Request, Response } from "express";
import { getResponseError, getResponseSuccess } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { books } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { z } from "@/config/openapi/openapi.js";

const BOOK_CACHE_PREFIX = "books:";

export const BookItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  gradeId: z.number().nullable().optional(),
  lessonId: z.number().nullable().optional(),
  isRecommended: z.boolean().nullable().optional(),
  subjectId: z.number().nullable().optional(),
  publishedDate: z.coerce.date().nullable().optional(),
  pdfUrl: z.string(),
  imageUrl: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}).openapi("BookItemSchema");


export const getAllBooks = async (req: Request, res: Response) => {
  try {
    const cacheKey = `${BOOK_CACHE_PREFIX}all`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsedCached = JSON.parse(cached);
      const responseBody = BookItemSchema.array().parse(parsedCached);
      getResponseSuccess(res, responseBody, "Books fetched successfully");
      return;
    }

    const allBooks = await db.select().from(books);
    await redis.set(cacheKey, JSON.stringify(allBooks), { EX: 60 * 60 });

    const responseBody = BookItemSchema.array().parse(allBooks);

    getResponseSuccess(res, responseBody, "Books fetched successfully");
    return;
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

