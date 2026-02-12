import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { books } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";
import { z } from "@/config/openapi/openapi.js";
import { AdminBookItemSchema } from "./get.js";
import { AuthenticatedRequest } from "@/types/request.js";

export const AdminCreateBookBodySchema = z.object({
  title: z.string(),
  author: z.string(),
  gradeId: z.string(),
  lessonId: z.string(),
  isRecommended: z.boolean(),
  subjectId: z.string(),
  publishedDate: z.string(),
  description: z.string(),
  pdfUrl: z.string(),
  imageUrl: z.string(),
}).openapi("AdminCreateBookBody");

export const AdminCreateBookResponseSchema = z.object({
  data: AdminBookItemSchema,
}).openapi("AdminCreateBookResponse");

export const createBook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const {
      title,
      author,
      gradeId,
      lessonId,
      isRecommended,
      subjectId,
      publishedDate,
      description,
      pdfUrl,
      imageUrl,
    } = await AdminCreateBookBodySchema.parseAsync(req.body);

    const result = await db
      .insert(books)
      .values({
        title,
        author,
        gradeId: Number(gradeId),
        lessonId: Number(lessonId),
        isRecommended,
        subjectId: Number(subjectId),
        publishedDate:
          publishedDate ? publishedDate : null,
        description,
        pdfUrl: pdfUrl ? `${process.env.R2_PDF_PUBLIC_URL}/${pdfUrl}` : null,
        imageUrl: imageUrl ? `${process.env.R2_PHOTO_PUBLIC_URL}/${imageUrl}` : null,
      })
      .returning();

    await redis.del("books:all");

    const responseBody = AdminCreateBookResponseSchema.parse({
      data: result[0],
    });

    return res.status(201).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

