import { Request, Response } from "express";
import { getResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { grades, subjects, lessons, topics } from "@/db/drizzle/schema.js";
import { isNull, sql } from "drizzle-orm";
import { redis } from "@/db/redis/redis.js";
import { z } from "@/config/openapi/openapi.js";
export const CurriculumsDashboardResponseSchema = z.object({
  numberOfGrades: z.number(),
  numberOfSubjects: z.number(),
  numberOfLessons: z.number(),
  numberOfTopics: z.number(),
}).openapi("CurriculumsDashboardResponse");

export const getCurriculumsDashboard = async (
  req: Request,
  res: Response
) => {
  try {
    const cached = await redis.get("curriculums:dashboard");
    if (cached) {
      return res.status(200).json(CurriculumsDashboardResponseSchema.parse(JSON.parse(cached)));
    }

    const numberOfGrades = await db
      .select({ count: sql<number>`count(*)` })
      .from(grades);
    const numberOfSubjects = await db
      .select({ count: sql<number>`count(*)` })
      .from(subjects);
    const numberOfLessons = await db
      .select({ count: sql<number>`count(*)` })
      .from(lessons);
    const numberOfTopics = await db
      .select({ count: sql<number>`count(*)` })
      .from(topics)
      .where(isNull(topics.exerciseId));

    const data = {
      numberOfGrades: numberOfGrades[0]?.count || 0,
      numberOfSubjects: numberOfSubjects[0]?.count || 0,
      numberOfLessons: numberOfLessons[0]?.count || 0,
      numberOfTopics: numberOfTopics[0]?.count || 0,
    };

    await redis.set("curriculums:dashboard", JSON.stringify(data), {
      EX: 60 * 60 * 24,
    });

    return res.status(200).json(CurriculumsDashboardResponseSchema.parse(data));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

