import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { books } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";
import { eq } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

const BOOK_CACHE_PREFIX = "books:";

export const FeedBooksBySubjectResponseSchema = z
  .object({
    data: z.array(
      z.object({
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
      })
    ),
  })
  .openapi("FeedBooksBySubjectResponse");

export const getBooksBySubject = async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.params;
    const cacheKey = `${BOOK_CACHE_PREFIX}subject:${subjectId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      const responseBody = FeedBooksBySubjectResponseSchema.parse({
        data: JSON.parse(cached),
      });
      return res.status(200).json(responseBody);
    }

    const result = await db
      .select()
      .from(books)
      .where(eq(books.subjectId, Number(subjectId)));
    await redis.set(cacheKey, JSON.stringify(result), { EX: 60 * 30 });

    const responseBody = FeedBooksBySubjectResponseSchema.parse({
      data: result,
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

