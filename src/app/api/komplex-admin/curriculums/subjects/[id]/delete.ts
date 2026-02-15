import { Request, Response } from "express";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { subjects } from "@/db/drizzle/schema.js";
import { eq, gt, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redis.js";
import { z } from "@/config/openapi/openapi.js";

export const DeleteSubjectParamsSchema = z.object({
  id: z.number(),
}).openapi("DeleteSubjectParams");

export const DeleteSubjectResponseSchema = z.object({
  message: z.string(),
}).openapi("DeleteSubjectResponse");

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { id } = await DeleteSubjectParamsSchema.parseAsync(req.params);

    const [oldOrderIndex] = await db
      .select({ orderIndex: subjects.orderIndex })
      .from(subjects)
      .where(eq(subjects.id, Number(id)));

    if (oldOrderIndex?.orderIndex === null) {
      throw new ResponseError("Old order index not found", 400);
    }

    await db
      .update(subjects)
      .set({ orderIndex: sql`${subjects.orderIndex} - 1` })
      .where(gt(subjects.orderIndex, oldOrderIndex.orderIndex as number));
    await db.delete(subjects).where(eq(subjects.id, Number(id)));
    await redis.del("curriculums");
    await redis.del("allSubjects");
    await redis.del("curriculums:dashboard");

    return res.status(200).json(DeleteSubjectResponseSchema.parse({ message: "subject deleted successfully" }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

