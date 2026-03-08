import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { grades } from "@/db/drizzle/schema.js";
import { eq, gt, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redis.js";
import { z } from "@/config/openapi/openapi.js";

export const DeleteGradeBodySchema = z.object({
  id: z.number(),
}).openapi("DeleteGradeBody");

export const DeleteGradeResponseSchema = z.object({
  message: z.string(),
}).openapi("DeleteGradeResponse");

export const deleteGrade = async (req: Request, res: Response) => {
  try {
    const { id } = await DeleteGradeBodySchema.parseAsync(req.params);

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

    return res.status(200).json(DeleteGradeResponseSchema.parse({ message: "grade deleted successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

