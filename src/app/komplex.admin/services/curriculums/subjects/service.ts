import { db } from "@/db/index.js";
import { eq, gt, gte, sql } from "drizzle-orm";
import { subjects } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const createSubject = async (
  name: string,
  icon: string,
  gradeId: number,
  orderIndex: number,
  insertType?: string
) => {
  try {
    let finalOrderIndex = orderIndex;

    if (orderIndex !== undefined && insertType === "before") {
      await db
        .update(subjects)
        .set({ orderIndex: sql`${subjects.orderIndex} + 1` })
        .where(gte(subjects.orderIndex, parseInt(orderIndex.toString())));
      finalOrderIndex = parseInt(orderIndex.toString());
    } else if (orderIndex !== undefined && insertType === "after") {
      await db
        .update(subjects)
        .set({ orderIndex: sql`${subjects.orderIndex} + 1` })
        .where(gt(subjects.orderIndex, parseInt(orderIndex.toString())));
      finalOrderIndex = parseInt(orderIndex.toString()) + 1;
    }

    await db.insert(subjects).values({
      name,
      icon,
      gradeId,
      orderIndex: finalOrderIndex,
    });
    await redis.del("allSubjects"); 
    await redis.del("curriculums");
    await redis.del("curriculums:dashboard");
  } catch (error) {
    throw new Error(`Failed to create subject: ${(error as Error).message}`);
  }
};
