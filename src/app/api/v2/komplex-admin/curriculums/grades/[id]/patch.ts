import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { grades } from "@/db/schema.js";
import { eq, gt, gte, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redisConfig.js";

export const updateGrade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newName, orderIndex, insertType } = req.body as {
      newName: string;
      orderIndex?: number;
      insertType?: string;
    };

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

    return res.status(200).json({ message: "grade updated successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

