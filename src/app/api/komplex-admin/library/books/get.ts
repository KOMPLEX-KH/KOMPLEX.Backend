import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { books } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";
import { z } from "@/config/openapi/openapi.js";

export const AdminBookItemSchema = z.object({
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

export const AdminBooksResponseSchema = z
  .object({
    data: z.array(AdminBookItemSchema),
  })
  .openapi("AdminBooksResponse");

export const getAllBooks = async (req: Request, res: Response) => {
  try {
    const cached = await redis.get("books:all");
    if (cached) {
      const responseBody = AdminBooksResponseSchema.parse({
        data: JSON.parse(cached),
      });
      return res.status(200).json(responseBody);
    }

    const result = await db.select().from(books);
    await redis.set("books:all", JSON.stringify(result), { EX: 60 * 60 });

    const responseBody = AdminBooksResponseSchema.parse({ data: result });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

