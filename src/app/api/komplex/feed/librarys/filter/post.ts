import { Request, Response } from "express";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { books } from "@/db/schema.js";
import { and, eq } from "drizzle-orm";

export const filterBooks = async (req: Request, res: Response) => {
  try {
    const { lessonId, subjectId } = req.body as {
      lessonId?: string;
      subjectId?: string;
    };

    const conditions: any[] = [];
    if (subjectId) {
      conditions.push(eq(books.subjectId, Number(subjectId)));
    }
    if (lessonId) {
      conditions.push(eq(books.lessonId, Number(lessonId)));
    }

    const query = conditions.length > 0 ? and(...conditions) : undefined;
    const result = await db.select().from(books).where(query);

    return res.status(200).json({ data: result });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

