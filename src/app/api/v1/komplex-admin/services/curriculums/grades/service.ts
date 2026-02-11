import { db } from "@/db/index.js";
import { eq, gt, gte, sql } from "drizzle-orm";
import { grades } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const createGrade = async (
  name: string,
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
      await redis.del("curriculums:dashboard");
    } else if (orderIndex !== undefined && insertType === "after") {
      await db
        .update(grades)
        .set({ orderIndex: sql`${grades.orderIndex} + 1` })
        .where(gt(grades.orderIndex, parseInt(orderIndex.toString())));
      finalOrderIndex = parseInt(orderIndex.toString()) + 1;
      await redis.del("curriculums:dashboard");
    }

    await db.insert(grades).values({ name, orderIndex: finalOrderIndex });
    await redis.del("allGrades");
    await redis.del("curriculums");
    await redis.del("curriculums:dashboard");
  } catch (error) {
    throw new Error(`Failed to create grade: ${(error as Error).message}`);
  }
};

