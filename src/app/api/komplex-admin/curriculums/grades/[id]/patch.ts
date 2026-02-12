import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { grades } from "@/db/schema.js";
import { eq, gt, gte, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redisConfig.js";
import { z } from "@/config/openapi/openapi.js";

export const UpdateGradeParamsSchema = z.object({
  id: z.number(),
}).openapi("UpdateGradeParams");

export const UpdateGradeBodySchema = z.object({
  id: z.number(),
  newName: z.string(),
  orderIndex: z.number().optional(),
  insertType: z.string().optional(),
}).openapi("UpdateGradeBody");

export const UpdateGradeResponseSchema = z.object({
  message: z.string(),
}).openapi("UpdateGradeResponse");

export const updateGrade = async (req: Request, res: Response) => {
  try {
    const { id } = await UpdateGradeParamsSchema.parseAsync(req.params);
    const { newName, orderIndex, insertType } = await UpdateGradeBodySchema.parseAsync(req.body);

    if (!newName) {
      throw new ResponseError("Missing required fields", 400);
    }

    const oldOrderIndex = await db
      .select({ orderIndex: grades.orderIndex })
      .from(grades)
      .where(eq(grades.id, Number(id)));

    if (oldOrderIndex[0]?.orderIndex === null) {
      throw new ResponseError("Old order index not found", 400);
    }

    if (
      orderIndex !== undefined &&
      insertType === "before" &&
      oldOrderIndex[0].orderIndex !== null
    ) {
      await db
        .update(grades)
        .set({ orderIndex: sql`${grades.orderIndex} + 1` })
        .where(gte(grades.orderIndex, parseInt(orderIndex.toString())));
      await db
        .update(grades)
        .set({ orderIndex: parseInt(orderIndex.toString()) })
        .where(eq(grades.id, Number(id)));
    } else if (
      orderIndex !== undefined &&
      insertType === "after" &&
      oldOrderIndex[0].orderIndex !== null
    ) {
      await db
        .update(grades)
        .set({ orderIndex: sql`${grades.orderIndex} + 1` })
        .where(gt(grades.orderIndex, parseInt(orderIndex.toString())));
      await db
        .update(grades)
        .set({ orderIndex: parseInt(orderIndex.toString()) + 1 })
        .where(eq(grades.id, Number(id)));
    }

    await db
      .update(grades)
      .set({ orderIndex: sql`${grades.orderIndex} - 1` })
      .where(gt(grades.orderIndex, oldOrderIndex[0].orderIndex as number));
    await db
      .update(grades)
      .set({ name: newName })
      .where(eq(grades.id, Number(id)));
    await redis.del("curriculums");
    await redis.del("curriculums:dashboard");
    await redis.del("allGrades");

    return res.status(200).json(UpdateGradeResponseSchema.parse({ message: "grade updated successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

