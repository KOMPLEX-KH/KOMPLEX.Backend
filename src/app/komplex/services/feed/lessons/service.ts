import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { grades, lessons, subjects, topics } from "@/db/schema.js";

export const getAllLessons = async () => {
  try {
    // Fetch all data with proper joins
    const allData = await db
      .select({
        gradeId: grades.id,
        grade: grades.grade,
        gradeKhmer: grades.gradeKhmer,
        subjectId: subjects.id,
        subject: subjects.subject,
        subjectTitle: subjects.title,
        englishTitle: subjects.englishTitle,
        subjectIcon: subjects.icon,
        lessonId: lessons.id,
        lesson: lessons.lesson,
        lessonTitle: lessons.title,
        lessonEnglishTitle: lessons.englishTitle,
        lessonIcon: lessons.icon,
        topicId: topics.id,
        topicTitle: topics.title,
        topicEnglishTitle: topics.englishTitle,
      })
      .from(grades)
      .leftJoin(subjects, eq(grades.id, subjects.gradeId))
      .leftJoin(lessons, eq(subjects.id, lessons.subjectId))
      .leftJoin(topics, eq(lessons.id, topics.lessonId))
      .orderBy(grades.id, subjects.id, lessons.id, topics.id);

    // Structure the data according to the required format
    const structuredData: any[] = [];
    const gradeMap = new Map();

    allData.forEach((row) => {
      // Initialize grade if not exists
      if (!gradeMap.has(row.gradeId)) {
        gradeMap.set(row.gradeId, {
          id: row.gradeId,
          grade: row.grade,
          gradeKhmer: row.gradeKhmer,
          content: new Map(),
        });
      }

      const gradeData = gradeMap.get(row.gradeId);

      // Initialize subject if not exists
      if (row.subjectId && !gradeData.content.has(row.subjectId)) {
        gradeData.content.set(row.subjectId, {
          id: row.subjectId,
          subject: row.subject,
          title: row.subjectTitle,
          englishTitle: row.englishTitle,
          icon: row.subjectIcon,
          lessons: new Map(),
        });
      }

      if (row.subjectId) {
        const subjectData = gradeData.content.get(row.subjectId);

        // Initialize lesson if not exists
        if (row.lessonId && !subjectData.lessons.has(row.lessonId)) {
          subjectData.lessons.set(row.lessonId, {
            id: row.lessonId,
            lesson: row.lesson,
            title: row.lessonTitle,
            englishTitle: row.lessonEnglishTitle,
            icon: row.lessonIcon,
            topics: [],
          });
        }

        if (row.lessonId) {
          const lessonData = subjectData.lessons.get(row.lessonId);

          // Add topic if exists
          if (row.topicId) {
            lessonData.topics.push({
              id: row.topicId,
              title: row.topicTitle,
              englishTitle: row.topicEnglishTitle,
            });
          }
        }
      }
    });

    // Convert maps to arrays and structure final response
    gradeMap.forEach((gradeData: any) => {
      const contentArray: any[] = [];

      gradeData.content.forEach((subjectData: any) => {
        const lessonsArray: any[] = [];

        subjectData.lessons.forEach((lessonData: any) => {
          lessonsArray.push(lessonData);
        });

        contentArray.push({
          id: subjectData.id,
          subject: subjectData.subject,
          title: subjectData.title,
          englishTitle: subjectData.englishTitle,
          icon: subjectData.icon,
          lessons: lessonsArray,
        });
      });

      structuredData.push({
        id: gradeData.id,
        grade: gradeData.grade,
        gradeKhmer: gradeData.gradeKhmer,
        content: contentArray,
      });
    });

    return { data: structuredData };
  } catch (error) {
    throw new Error(`Error fetching lessons: ${(error as Error).message}`);
  }
};
