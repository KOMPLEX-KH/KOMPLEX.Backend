import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { lessons } from "@/db/drizzle/schema.js";
import { eq, gt, gte, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redis.js";
import { z } from "@/config/openapi/openapi.js";

export const UpdateLessonParamsSchema = z.object({
  id: z.number(),
}).openapi("UpdateLessonParams");

export const UpdateLessonBodySchema = z.object({
  id: z.number(),
  newName: z.string(),
  orderIndex: z.number().optional(),
  insertType: z.string().optional(),
  icon: z.string().optional(),
}).openapi("UpdateLessonBody");

export const UpdateLessonResponseSchema = z.object({
  message: z.string(),
}).openapi("UpdateLessonResponse");

export const updateLesson = async (req: Request, res: Response) => {
  try {
    const { id } = await UpdateLessonParamsSchema.parseAsync(req.params);
    const { newName, orderIndex, insertType, icon } = await UpdateLessonBodySchema.parseAsync(req.body);

    if (!newName) {
      throw new ResponseError("Missing required fields", 400);
    }

    const oldOrderIndex = await db
      .select({ orderIndex: lessons.orderIndex })
      .from(lessons)
      .where(eq(lessons.id, Number(id)));

    if (oldOrderIndex[0]?.orderIndex === null) {
      throw new ResponseError("Old order index not found", 400);
    }

    if (
      orderIndex !== undefined &&
      insertType === "before" &&
      oldOrderIndex[0].orderIndex !== null
    ) {
      await db
        .update(lessons)
        .set({ orderIndex: sql`${lessons.orderIndex} + 1` })
        .where(gte(lessons.orderIndex, parseInt(orderIndex.toString())));
      await db
        .update(lessons)
        .set({ orderIndex: parseInt(orderIndex.toString()) })
        .where(eq(lessons.id, Number(id)));
    } else if (
      orderIndex !== undefined &&
      insertType === "after" &&
      oldOrderIndex[0].orderIndex !== null
    ) {
      await db
        .update(lessons)
        .set({ orderIndex: sql`${lessons.orderIndex} + 1` })
        .where(gt(lessons.orderIndex, parseInt(orderIndex.toString())));
      await db
        .update(lessons)
        .set({ orderIndex: parseInt(orderIndex.toString()) + 1 })
        .where(eq(lessons.id, Number(id)));
    }

    await db
      .update(lessons)
      .set({ orderIndex: sql`${lessons.orderIndex} - 1` })
      .where(gt(lessons.orderIndex, oldOrderIndex[0].orderIndex as number));

    const updateData: any = { name: newName };
    if (icon !== undefined) {
      updateData.icon = icon;
    }

    await db.update(lessons).set(updateData).where(eq(lessons.id, Number(id)));
    await redis.del("curriculums");
    await redis.del("curriculums:dashboard");

    return res.status(200).json(UpdateLessonResponseSchema.parse({ message: "lesson updated successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

