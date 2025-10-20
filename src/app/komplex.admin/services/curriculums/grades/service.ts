import { db } from "@/db/index.js";
import { eq, gt, gte, sql } from "drizzle-orm";
import { grades } from "@/db/schema.js";

export const createGrade = async (
  gradeKhmer: string,
  orderIndex: number,
  insertType?: string
) => {
  try {
    let finalOrderIndex = orderIndex;

    if (orderIndex !== undefined && insertType === "before") {
      await db
        .update(grades)
        .set({ orderIndex: sql`${grades.orderIndex} + 1` })
        .where(gte(grades.orderIndex, parseInt(orderIndex.toString())));
      finalOrderIndex = parseInt(orderIndex.toString());
    } else if (orderIndex !== undefined && insertType === "after") {
      await db
        .update(grades)
        .set({ orderIndex: sql`${grades.orderIndex} + 1` })
        .where(gt(grades.orderIndex, parseInt(orderIndex.toString())));
      finalOrderIndex = parseInt(orderIndex.toString()) + 1;
    }

    await db.insert(grades).values({ gradeKhmer, orderIndex: finalOrderIndex });
  } catch (error) {
    throw new Error(`Failed to create grade: ${(error as Error).message}`);
  }
};

