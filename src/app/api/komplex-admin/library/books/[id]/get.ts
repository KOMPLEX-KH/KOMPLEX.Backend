import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { books } from "@/db/drizzle/schema.js";
import { redis } from "@/db/redis/redis.js";
import { eq } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";
import { AdminBookItemSchema } from "../get.js";

const BOOK_CACHE_PREFIX = "book:";

export const AdminBookByIdResponseSchema = z
  .object({
    data: AdminBookItemSchema,
  })
  .openapi("AdminBookByIdResponse");

export const getBookById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new ResponseError("Invalid ID parameter", 400);
    }

    const cacheKey = `${BOOK_CACHE_PREFIX}${id}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      const responseBody = AdminBookByIdResponseSchema.parse({
        data: JSON.parse(cached),
      });
      return res.status(200).json(responseBody);
    }

    const result = await db
      .select()
      .from(books)
      .where(eq(books.id, Number(id)));

    if (result.length === 0) {
      throw new ResponseError("Book not found", 404);
    }

    await redis.set(cacheKey, JSON.stringify(result[0]), { EX: 60 * 60 });

    const responseBody = AdminBookByIdResponseSchema.parse({
      data: result[0],
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

