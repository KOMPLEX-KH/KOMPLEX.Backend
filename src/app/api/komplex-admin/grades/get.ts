import { Request, Response } from "express";
import { getResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { grades } from "@/db/drizzle/schema.js";
import { z } from "@/config/openapi/openapi.js";

export const AdminGradesResponseSchema = z
  .object({
    grade: z.string(),
  })
  .array()
  .openapi("AdminGradesResponse");

export const getGrades = async (req: Request, res: Response) => {
  try {
    const cacheKey = `allGrades`;
    const cacheData = await redis.get(cacheKey);
    if (cacheData) {
      const parsed = AdminGradesResponseSchema.parse(JSON.parse(cacheData));
      return res.status(200).json(parsed);
    }

    const result = await db
      .select({
        grade: grades.name,
      })
      .from(grades);

    const parsed = AdminGradesResponseSchema.parse(result);
    await redis.set(cacheKey, JSON.stringify(parsed), { EX: 60 * 60 * 24 });
    return res.status(200).json(parsed);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
