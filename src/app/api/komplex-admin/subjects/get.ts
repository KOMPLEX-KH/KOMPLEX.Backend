import { Request, Response } from "express";
import { getResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { redis } from "@/db/redis/redis.js";
import { subjects } from "@/db/drizzle/schema.js";
import { z } from "@/config/openapi/openapi.js";

export const AdminSubjectsResponseSchema = z
  .object({
    subject: z.string(),
  })
  .array()
  .openapi("AdminSubjectsResponse");

export const getSubjects = async (req: Request, res: Response) => {
  try {
    const cacheKey = `allSubjects`;
    const cacheData = await redis.get(cacheKey);
    if (cacheData) {
      const parsed = AdminSubjectsResponseSchema.parse(JSON.parse(cacheData));
      return res.status(200).json(parsed);
    }

    const result = await db
      .select({
        subject: subjects.name,
      })
      .from(subjects);

    const parsed = AdminSubjectsResponseSchema.parse(result);
    await redis.set(cacheKey, JSON.stringify(parsed), { EX: 60 * 60 * 24 });
    return res.status(200).json(parsed);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
