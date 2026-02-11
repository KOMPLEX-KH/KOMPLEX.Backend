import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { books } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const createBook = async (req: Request, res: Response) => {
  try {
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
    } = req.body as any;

    if (!title || !author) {
      throw new ResponseError("Missing required fields", 400);
    }

    const result = await db
      .insert(books)
      .values({
        title,
        author,
        gradeId,
        lessonId,
        isRecommended,
        subjectId,
        publishedDate:
          typeof publishedDate === "string"
            ? publishedDate
            : publishedDate instanceof Date
              ? publishedDate.toISOString().split("T")[0]
              : publishedDate,
        description,
        pdfUrl,
        imageUrl,
      })
      .returning();

    await redis.del("books:all");

    return res.status(201).json({ data: result[0] });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

