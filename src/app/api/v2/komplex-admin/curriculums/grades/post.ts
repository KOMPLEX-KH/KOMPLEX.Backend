import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { grades } from "@/db/schema.js";
import { eq, gt, gte, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redisConfig.js";

export const createGrade = async (req: Request, res: Response) => {
  try {
    const { gradeKhmer, orderIndex, insertType } = req.body as {
      gradeKhmer: string;
      orderIndex: number;
      insertType?: string;
    };

    if (!gradeKhmer || orderIndex === undefined) {
      throw new ResponseError("Missing required fields", 400);
    }

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

    await db
      .insert(grades)
      .values({ name: gradeKhmer, orderIndex: finalOrderIndex });
    await redis.del("allGrades");
    await redis.del("curriculums");
    await redis.del("curriculums:dashboard");

    return res.status(201).json({ message: "grade created successfully" });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

