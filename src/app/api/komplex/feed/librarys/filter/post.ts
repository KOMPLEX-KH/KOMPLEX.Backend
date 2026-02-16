import { Request, Response } from "express";
import { getResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { books } from "@/db/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const FilterBooksBodySchema = z
  .object({
    lessonId: z.string().optional(),
    subjectId: z.string().optional(),
  })
  .openapi("FilterBooksBody");

export const FilterBooksResponseSchema = z
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
  .openapi("FilterBooksResponse");

export const filterBooks = async (req: Request, res: Response) => {
  try {
    const { lessonId, subjectId } = await FilterBooksBodySchema.parseAsync(
      req.body
    );

    const conditions: any[] = [];
    if (subjectId) {
      conditions.push(eq(books.subjectId, Number(subjectId)));
    }
    if (lessonId) {
      conditions.push(eq(books.lessonId, Number(lessonId)));
    }

    const query = conditions.length > 0 ? and(...conditions) : undefined;
    const result = await db.select().from(books).where(query);

    const responseBody = FilterBooksResponseSchema.parse({ data: result });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

