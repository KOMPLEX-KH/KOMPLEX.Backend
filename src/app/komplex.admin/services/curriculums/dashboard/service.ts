import { db } from "@/db/index.js";
import { isNotNull, isNull, sql } from "drizzle-orm";
import { grades, subjects, lessons, topics } from "@/db/schema.js";

export const getDashboardData = async () => {
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
  return data;
};
