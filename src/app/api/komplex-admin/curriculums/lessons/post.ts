import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { lessons } from "@/db/drizzle/schema.js";
import { gt, gte, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redis.js";
import { z } from "@/config/openapi/openapi.js";

export const CreateLessonBodySchema = z.object({
  title: z.string(),
  icon: z.string(),
  subjectId: z.number(),
  orderIndex: z.number(),
  insertType: z.string().optional(),
}).openapi("CreateLessonBody");

export const CreateLessonResponseSchema = z.object({
  message: z.string(),
}).openapi("CreateLessonResponse");

export const createLesson = async (req: Request, res: Response) => {
  try {
    const { title, icon, subjectId, orderIndex, insertType } = await CreateLessonBodySchema.parseAsync(req.body);

    if (!title || !icon || subjectId === undefined || orderIndex === undefined) {
      throw new ResponseError("Missing required fields", 400);
    }

    let finalOrderIndex = orderIndex;

    if (orderIndex !== undefined && insertType === "before") {
      await db
        .update(lessons)
        .set({ orderIndex: sql`${lessons.orderIndex} + 1` })
        .where(gte(lessons.orderIndex, parseInt(orderIndex.toString())));
      finalOrderIndex = parseInt(orderIndex.toString());
    } else if (orderIndex !== undefined && insertType === "after") {
      await db
        .update(lessons)
        .set({ orderIndex: sql`${lessons.orderIndex} + 1` })
        .where(gt(lessons.orderIndex, parseInt(orderIndex.toString())));
      finalOrderIndex = parseInt(orderIndex.toString()) + 1;
    }

    await db.insert(lessons).values({
      name: title,
      icon,
      subjectId,
      orderIndex: finalOrderIndex,
    });
    await redis.del("curriculums");
    await redis.del("curriculums:dashboard");

    return res.status(201).json(CreateLessonResponseSchema.parse({ message: "lesson created successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

