import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";
import { grades, lessons, subjects, topics } from "@/db/schema.js";

export const updateLessonTopicComponent = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { component, componentCode } = req.body;
    await db
      .update(topics)
      .set({ component: component, componentCode: componentCode })  
      .where(eq(topics.id, id));
    res.json({ message: "Lesson updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update lesson" + error });
  }
};

export const updateLessonTopic = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { title, englishTitle, orderIndex } = req.body;
    await db
      .update(topics)
      .set({ title, englishTitle, orderIndex })
      .where(eq(topics.id, parseInt(id)));
    res.json({ message: "Lesson topic updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update lesson topic" + error });
  }
};

export const updateLessonGrade = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { grade, gradeKhmer, orderIndex } = req.body;
    await db
      .update(grades)
      .set({ grade, gradeKhmer, orderIndex })
      .where(eq(grades.id, parseInt(id)));
    res.json({ message: "Lesson grade updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update lesson grade" + error });
  }
};

export const updateLessonSubject = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { subject, title, englishTitle, icon, gradeId, orderIndex } =
      req.body;
    await db
      .update(subjects)
      .set({ subject, title, englishTitle, icon, gradeId, orderIndex })
      .where(eq(subjects.id, parseInt(id)));
    res.json({ message: "Lesson subject updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update lesson subject" + error });
  }
};

export const updateLessonLesson = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { lesson, title, englishTitle, icon, subjectId, orderIndex } =
      req.body;
    await db
      .update(lessons)
      .set({ lesson, title, englishTitle, icon, subjectId, orderIndex })
      .where(eq(lessons.id, parseInt(id)));
    res.json({ message: "Lesson lesson updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update lesson lesson" + error });
  }
};

export const deleteLessonTopic = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    await db.delete(topics).where(eq(topics.id, parseInt(id)));
    res.json({ message: "Lesson topic deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete lesson topic" + error });
  }
};

export const deleteLessonGrade = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    await db.delete(grades).where(eq(grades.id, parseInt(id)));
    res.json({ message: "Lesson grade deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete lesson grade" + error });
  }
};

export const deleteLessonSubject = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    await db.delete(subjects).where(eq(subjects.id, parseInt(id)));
    res.json({ message: "Lesson subject deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete lesson subject" + error });
  }
};
export const deleteLessonLesson = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    await db.delete(lessons).where(eq(lessons.id, parseInt(id)));
    res.json({ message: "Lesson lesson deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete lesson lesson" + error });
  }
};

export const createLessonTopic = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      title,
      englishTitle,
      component,
      componentCode,
      lessonId,
      orderIndex,
    } = req.body;
    await db.insert(topics).values({
      title,
      englishTitle,
      component,
      componentCode,
      lessonId,
      orderIndex,
    });
    res.json({ message: "Lesson topic created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create lesson topic" + error });
  }
};
export const createLessonGrade = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { grade, gradeKhmer, orderIndex } = req.body;
    await db.insert(grades).values({ grade, gradeKhmer, orderIndex });
    res.json({ message: "Lesson grade created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create lesson grade" + error });
  }
};
export const createLessonSubject = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { subject, title, englishTitle, icon, gradeId, orderIndex } =
      req.body;
    await db
      .insert(subjects)
      .values({ subject, title, englishTitle, icon, gradeId, orderIndex });
    res.json({ message: "Lesson subject created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create lesson subject" + error });
  }
};

export const createLessonLesson = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { lesson, title, englishTitle, icon, subjectId, orderIndex } =
      req.body;
    await db
      .insert(lessons)
      .values({ lesson, title, englishTitle, icon, subjectId, orderIndex });
    res.json({ message: "Lesson lesson created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create lesson lesson" + error });
  }
};
