import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { books } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";
import { eq } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";
import { AdminBookItemSchema } from "../get.js";

const BOOK_CACHE_PREFIX = "book:";

export const AdminDeleteBookParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("AdminDeleteBookParams");

export const AdminDeleteBookResponseSchema = z
  .object({
    message: z.string(),
    data: AdminBookItemSchema,
  })
  .openapi("AdminDeleteBookResponse");

export const deleteBook = async (req: Request, res: Response) => {
  try {
    const { id } = await AdminDeleteBookParamsSchema.parseAsync(req.params);

    const result = await db
      .delete(books)
      .where(eq(books.id, Number(id)))
      .returning();

    if (result.length === 0) {
      throw new ResponseError("Book not found", 404);
    }

    await redis.del(`${BOOK_CACHE_PREFIX}${id}`);
    await redis.del("books:all");

    const responseBody = AdminDeleteBookResponseSchema.parse({
      message: "Book deleted",
      data: result[0],
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

