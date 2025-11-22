import { db } from "@/db/index.js";
import { eq, gt, gte, sql } from "drizzle-orm";
import { lessons } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const updateLesson = async (
  id: number,
  newName: string,
  orderIndex?: number,
  insertType?: string,
  icon?: string
) => {
  try {
    const oldOrderIndex = await db
      .select({ orderIndex: lessons.orderIndex })
      .from(lessons)
      .where(eq(lessons.id, id));

    if (oldOrderIndex[0].orderIndex === null) {
      throw new Error("Old order index not found");
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
        .where(eq(lessons.id, id));
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
        .where(eq(lessons.id, id));
    }

    // clean up
    await db
      .update(lessons)
      .set({ orderIndex: sql`${lessons.orderIndex} - 1` })
      .where(gt(lessons.orderIndex, oldOrderIndex[0].orderIndex as number));

    const updateData: any = { name: newName };
    if (icon !== undefined) {
      updateData.icon = icon;
    }

    await db.update(lessons).set(updateData).where(eq(lessons.id, id));
    await redis.del("curriculums");
    await redis.del("curriculums:dashboard");
  } catch (error) {
    throw new Error(`Failed to update lesson: ${(error as Error).message}`);
  }
};

export const deleteLesson = async (id: number) => {
  try {
    const [oldOrderIndex] = await db
      .select({ orderIndex: lessons.orderIndex })
      .from(lessons)
      .where(eq(lessons.id, id));

    if (oldOrderIndex.orderIndex === null) {
      throw new Error("Old order index not found");
    }

    await db
      .update(lessons)
      .set({ orderIndex: sql`${lessons.orderIndex} - 1` })
      .where(gt(lessons.orderIndex, oldOrderIndex.orderIndex as number));
    await db.delete(lessons).where(eq(lessons.id, id));
    await redis.del("curriculums");
    await redis.del("curriculums:dashboard");
  } catch (error) {
    throw new Error(`Failed to delete lesson: ${(error as Error).message}`);
  }
};
