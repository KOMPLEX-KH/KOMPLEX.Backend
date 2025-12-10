import { db } from "@/db/index.js";
import { eq, gt, gte, sql } from "drizzle-orm";
import { grades } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const updateGrade = async (
    id: number,
    newName: string,
    orderIndex?: number,
    insertType?: string
  ) => {
    try {
      const oldOrderIndex = await db
        .select({ orderIndex: grades.orderIndex })
        .from(grades)
        .where(eq(grades.id, id));
  
      if (oldOrderIndex[0].orderIndex === null) {
        throw new Error("Old order index not found");
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
          .where(eq(grades.id, id));
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
          .where(eq(grades.id, id));
      }
  
      // clean up
      await db
        .update(grades)
        .set({ orderIndex: sql`${grades.orderIndex} - 1` })
        .where(gt(grades.orderIndex, oldOrderIndex[0].orderIndex as number));
      await db
        .update(grades)
        .set({ name: newName })
        .where(eq(grades.id, id));
        await redis.del("curriculums");
        await redis.del("curriculums:dashboard");
        await redis.del("allGrades");
    } catch (error) {
      throw new Error(`Failed to update grade: ${(error as Error).message}`);
    }
  };
  
  export const deleteGrade = async (id: number) => {
    try {
      const [oldOrderIndex] = await db
        .select({ orderIndex: grades.orderIndex })
        .from(grades)
        .where(eq(grades.id, id));
  
      if (oldOrderIndex.orderIndex === null) {
        throw new Error("Old order index not found");
      }
  
      await db
        .update(grades)
        .set({ orderIndex: sql`${grades.orderIndex} - 1` })
        .where(gt(grades.orderIndex, oldOrderIndex.orderIndex as number));
      await db.delete(grades).where(eq(grades.id, id));
      await redis.del("curriculums");
      await redis.del("curriculums:dashboard");
      await redis.del("allGrades");
    } catch (error) {
      throw new Error(`Failed to delete grade: ${(error as Error).message}`);
    }
  };
  