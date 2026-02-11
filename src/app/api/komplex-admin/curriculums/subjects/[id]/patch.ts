import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { subjects } from "@/db/schema.js";
import { eq, gt, gte, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redisConfig.js";

export const updateSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newName, orderIndex, insertType, icon } = req.body as {
      newName: string;
      orderIndex?: number;
      insertType?: string;
      icon?: string;
    };

    if (!newName) {
      throw new ResponseError("Missing required fields", 400);
    }

    const oldOrderIndex = await db
      .select({ orderIndex: subjects.orderIndex })
      .from(subjects)
      .where(eq(subjects.id, Number(id)));

    if (oldOrderIndex[0]?.orderIndex === null) {
      throw new ResponseError("Old order index not found", 400);
    }

    if (
      orderIndex !== undefined &&
      insertType === "before" &&
      oldOrderIndex[0].orderIndex !== null
    ) {
      await db
        .update(subjects)
        .set({ orderIndex: sql`${subjects.orderIndex} + 1` })
        .where(gte(subjects.orderIndex, parseInt(orderIndex.toString())));
      await db
        .update(subjects)
        .set({ orderIndex: parseInt(orderIndex.toString()) })
        .where(eq(subjects.id, Number(id)));
    } else if (
      orderIndex !== undefined &&
      insertType === "after" &&
      oldOrderIndex[0].orderIndex !== null
    ) {
      await db
        .update(subjects)
        .set({ orderIndex: sql`${subjects.orderIndex} + 1` })
        .where(gt(subjects.orderIndex, parseInt(orderIndex.toString())));
      await db
        .update(subjects)
        .set({ orderIndex: parseInt(orderIndex.toString()) + 1 })
        .where(eq(subjects.id, Number(id)));
    }

    await db
      .update(subjects)
      .set({ orderIndex: sql`${subjects.orderIndex} - 1` })
      .where(gt(subjects.orderIndex, oldOrderIndex[0].orderIndex as number));

    const updateData: any = { name: newName };
    if (icon !== undefined) {
      updateData.icon = icon;
    }

    await db.update(subjects).set(updateData).where(eq(subjects.id, Number(id)));
    await redis.del("allSubjects");
    await redis.del("curriculums");
    await redis.del("curriculums:dashboard");

    return res.status(200).json({ message: "subject updated successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

