import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { grades } from "@/db/schema.js";
import { eq, gt, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redisConfig.js";

export const deleteGrade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [oldOrderIndex] = await db
      .select({ orderIndex: grades.orderIndex })
      .from(grades)
      .where(eq(grades.id, Number(id)));

    if (oldOrderIndex?.orderIndex === null) {
      throw new ResponseError("Old order index not found", 400);
    }

    await db
      .update(grades)
      .set({ orderIndex: sql`${grades.orderIndex} - 1` })
      .where(gt(grades.orderIndex, oldOrderIndex.orderIndex as number));
    await db.delete(grades).where(eq(grades.id, Number(id)));
    await redis.del("curriculums");
    await redis.del("curriculums:dashboard");
    await redis.del("allGrades");

    return res.status(200).json({ message: "grade deleted successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

