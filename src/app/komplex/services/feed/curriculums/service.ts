import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { grades, lessons, subjects, topics } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";

export const getAllCurriculums = async () => {
  try {
    const cached = await redis.get("curriculums");
    if (cached) {
      return { data: JSON.parse(cached) };
    }
    const allData = await db
      .select({
        gradeId: grades.id,
        gradeName: grades.name,
        gradeOrderIndex: grades.orderIndex,
        subjectId: subjects.id,
        subjectName: subjects.name,
        subjectIcon: subjects.icon,
        subjectOrderIndex: subjects.orderIndex,
        lessonId: lessons.id,
        lessonName: lessons.name,
        lessonIcon: lessons.icon,
        lessonOrderIndex: lessons.orderIndex,
        topicId: topics.id,
        topicName: topics.name,
        exerciseId: topics.exerciseId,
        topicOrderIndex: topics.orderIndex,
      })
      .from(grades)
      .leftJoin(subjects, eq(grades.id, subjects.gradeId))
      .leftJoin(lessons, eq(subjects.id, lessons.subjectId))
      .leftJoin(topics, eq(lessons.id, topics.lessonId))
      .orderBy(
        grades.orderIndex,
        subjects.orderIndex,
        lessons.orderIndex,
        topics.orderIndex
      );

    // Structure the data according to the required format
    const structuredData: any[] = [];
    const gradeMap = new Map();

    allData.forEach((row) => {
      // Initialize grade if not exists
      if (!gradeMap.has(row.gradeId)) {
        gradeMap.set(row.gradeId, {
          id: row.gradeId,
          name: row.gradeName,
          subjects: new Map(),
          orderIndex: row.gradeOrderIndex,
        });
      }

      const gradeData = gradeMap.get(row.gradeId);

      // Initialize subject if not exists
      if (row.subjectId && !gradeData.subjects.has(row.subjectId)) {
        gradeData.subjects.set(row.subjectId, {
          id: row.subjectId,
          name: row.subjectName,
          icon: row.subjectIcon,
          orderIndex: row.subjectOrderIndex,
          lessons: new Map(),
        });
      }

      if (row.subjectId) {
        const subjectData = gradeData.subjects.get(row.subjectId);

        // Initialize lesson if not exists
        if (row.lessonId && !subjectData.lessons.has(row.lessonId)) {
          subjectData.lessons.set(row.lessonId, {
            id: row.lessonId,
            name: row.lessonName,
            icon: row.lessonIcon,
            topics: [],
            orderIndex: row.lessonOrderIndex,
          });
        }

        if (row.lessonId) {
          const lessonData = subjectData.lessons.get(row.lessonId);

          // Add topic if exists
          if (row.topicId) {
            lessonData.topics.push({
              id: row.topicId,
              name: row.topicName,
              exerciseId: row.exerciseId,
              orderIndex: row.topicOrderIndex,
            });
          }
        }
      }
    });

    // Convert maps to arrays and structure final response
    gradeMap.forEach((gradeData: any) => {
      const subjectsArray: any[] = [];

      gradeData.subjects.forEach((subjectData: any) => {
        const lessonsArray: any[] = [];

        subjectData.lessons.forEach((lessonData: any) => {
          lessonsArray.push(lessonData);
        });

        subjectsArray.push({
          id: subjectData.id,
          name: subjectData.name,
          icon: subjectData.icon,
          orderIndex: subjectData.orderIndex,
          lessons: lessonsArray,
        });
      });

      structuredData.push({
        id: gradeData.id,
        name: gradeData.name,
        orderIndex: gradeData.orderIndex,
        subjects: subjectsArray,
      });
    });

    await redis.set("curriculums", JSON.stringify(structuredData), {
      EX: 60 * 60 * 24,
    });

    return { data: structuredData };
  } catch (error) {
    throw new Error(`Error fetching curriculums: ${(error as Error).message}`);
  }
};
