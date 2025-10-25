import { db } from "@/db/index.js";
import { eq, gt, gte, sql } from "drizzle-orm";
import { lessons } from "@/db/schema.js";

export const createLesson = async (
  name: string,
  icon: string,
  subjectId: number,
  orderIndex: number,
  insertType?: string
) => {
  try {
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
      name,
      icon,
      subjectId,
      orderIndex: finalOrderIndex,
    });
  } catch (error) {
    throw new Error(`Failed to create lesson: ${(error as Error).message}`);
  }
};
