import { db } from "@/db/index.js";
import { eq, gt, gte, lt, lte, max, not, sql } from "drizzle-orm";
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
    const { newName, orderIndex, insertType } = req.body;
    const oldOrderIndex = await db
      .select({ orderIndex: topics.orderIndex })
      .from(topics)
      .where(eq(topics.id, parseInt(id)));
    if (oldOrderIndex[0].orderIndex === null) {
      return res.status(400).json({ error: "Old order index not found" });
    }
    if (
      orderIndex !== undefined &&
      insertType === "before" &&
      oldOrderIndex[0].orderIndex !== null
    ) {
      await db
        .update(topics)
        .set({ orderIndex: sql`${topics.orderIndex} + 1` })
        .where(gte(topics.orderIndex, parseInt(orderIndex)));
      await db
        .update(topics)
        .set({ orderIndex: parseInt(orderIndex) })
        .where(eq(topics.id, parseInt(id)));
    } else if (
      orderIndex !== undefined &&
      insertType === "after" &&
      oldOrderIndex[0].orderIndex !== null
    ) {
      await db
        .update(topics)
        .set({ orderIndex: sql`${topics.orderIndex} + 1` })
        .where(gt(topics.orderIndex, parseInt(orderIndex)));
      await db
        .update(topics)
        .set({ orderIndex: parseInt(orderIndex) + 1 })
        .where(eq(topics.id, parseInt(id)));
    }

    // clean up
    await db
      .update(topics)
      .set({ orderIndex: sql`${topics.orderIndex} - 1` })
      .where(gt(topics.orderIndex, oldOrderIndex[0].orderIndex as number));
    await db
      .update(topics)
      .set({ title: newName })
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
    const { newName, orderIndex, insertType } = req.body;
    const oldOrderIndex = await db
      .select({ orderIndex: grades.orderIndex })
      .from(grades)
      .where(eq(grades.id, parseInt(id)));
    if (oldOrderIndex[0].orderIndex === null) {
      return res.status(400).json({ error: "Old order index not found" });
    }
    if (
      orderIndex !== undefined &&
      insertType === "before" &&
      oldOrderIndex[0].orderIndex !== null
    ) {
      await db
        .update(grades)
        .set({ orderIndex: sql`${grades.orderIndex} + 1` })
        .where(gte(grades.orderIndex, parseInt(orderIndex)));
      await db
        .update(grades)
        .set({ orderIndex: parseInt(orderIndex) })
        .where(eq(grades.id, parseInt(id)));
    } else if (
      orderIndex !== undefined &&
      insertType === "after" &&
      oldOrderIndex[0].orderIndex !== null
    ) {
      await db
        .update(grades)
        .set({ orderIndex: sql`${grades.orderIndex} + 1` })
        .where(gt(grades.orderIndex, parseInt(orderIndex)));
      await db
        .update(grades)
        .set({ orderIndex: parseInt(orderIndex) + 1 })
        .where(eq(grades.id, parseInt(id)));
    }

    // clean up
    await db
      .update(grades)
      .set({ orderIndex: sql`${grades.orderIndex} - 1` })
      .where(gt(grades.orderIndex, oldOrderIndex[0].orderIndex as number));
    await db
      .update(grades)
      .set({ gradeKhmer: newName })
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
    const { newName, orderIndex, insertType, icon } = req.body;
    const oldOrderIndex = await db
      .select({ orderIndex: subjects.orderIndex })
      .from(subjects)
      .where(eq(subjects.id, parseInt(id)));
    if (oldOrderIndex[0].orderIndex === null) {
      return res.status(400).json({ error: "Old order index not found" });
    }
    if (
      orderIndex !== undefined &&
      insertType === "before" &&
      oldOrderIndex[0].orderIndex !== null
    ) {
      await db
        .update(subjects)
        .set({ orderIndex: sql`${subjects.orderIndex} + 1` })
        .where(gte(subjects.orderIndex, parseInt(orderIndex)));
      await db
        .update(subjects)
        .set({ orderIndex: parseInt(orderIndex) })
        .where(eq(subjects.id, parseInt(id)));
    } else if (
      orderIndex !== undefined &&
      insertType === "after" &&
      oldOrderIndex[0].orderIndex !== null
    ) {
      await db
        .update(subjects)
        .set({ orderIndex: sql`${subjects.orderIndex} + 1` })
        .where(gt(subjects.orderIndex, parseInt(orderIndex)));
      await db
        .update(subjects)
        .set({ orderIndex: parseInt(orderIndex) + 1 })
        .where(eq(subjects.id, parseInt(id)));
    }

    // clean up
    await db
      .update(subjects)
      .set({ orderIndex: sql`${subjects.orderIndex} - 1` })
      .where(gt(subjects.orderIndex, oldOrderIndex[0].orderIndex as number));

    const updateData: any = { title: newName };
    if (icon !== undefined) {
      updateData.icon = icon;
    }

    await db
      .update(subjects)
      .set(updateData)
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
    const { newName, orderIndex, insertType, icon } = req.body;
    const oldOrderIndex = await db
      .select({ orderIndex: lessons.orderIndex })
      .from(lessons)
      .where(eq(lessons.id, parseInt(id)));
    if (oldOrderIndex[0].orderIndex === null) {
      return res.status(400).json({ error: "Old order index not found" });
    }
    if (
      orderIndex !== undefined &&
      insertType === "before" &&
      oldOrderIndex[0].orderIndex !== null
    ) {
      await db
        .update(lessons)
        .set({ orderIndex: sql`${lessons.orderIndex} + 1` })
        .where(gte(lessons.orderIndex, parseInt(orderIndex)));
      await db
        .update(lessons)
        .set({ orderIndex: parseInt(orderIndex) })
        .where(eq(lessons.id, parseInt(id)));
    } else if (
      orderIndex !== undefined &&
      insertType === "after" &&
      oldOrderIndex[0].orderIndex !== null
    ) {
      await db
        .update(lessons)
        .set({ orderIndex: sql`${lessons.orderIndex} + 1` })
        .where(gt(lessons.orderIndex, parseInt(orderIndex)));
      await db
        .update(lessons)
        .set({ orderIndex: parseInt(orderIndex) + 1 })
        .where(eq(lessons.id, parseInt(id)));
    }

    // clean up
    await db
      .update(lessons)
      .set({ orderIndex: sql`${lessons.orderIndex} - 1` })
      .where(gt(lessons.orderIndex, oldOrderIndex[0].orderIndex as number));

    const updateData: any = { title: newName };
    if (icon !== undefined) {
      updateData.icon = icon;
    }

    await db
      .update(lessons)
      .set(updateData)
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
    const [oldOrderIndex] = await db
      .select({ orderIndex: topics.orderIndex })
      .from(topics)
      .where(eq(topics.id, parseInt(id)));
    if (oldOrderIndex.orderIndex === null) {
      return res.status(400).json({ error: "Old order index not found" });
    }
    await db
      .update(topics)
      .set({ orderIndex: sql`${topics.orderIndex} - 1` })
      .where(gt(topics.orderIndex, oldOrderIndex.orderIndex as number));
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
    const [oldOrderIndex] = await db
      .select({ orderIndex: grades.orderIndex })
      .from(grades)
      .where(eq(grades.id, parseInt(id)));
    if (oldOrderIndex.orderIndex === null) {
      return res.status(400).json({ error: "Old order index not found" });
    }
    await db
      .update(grades)
      .set({ orderIndex: sql`${grades.orderIndex} - 1` })
      .where(gt(grades.orderIndex, oldOrderIndex.orderIndex as number));
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
    const [oldOrderIndex] = await db
      .select({ orderIndex: subjects.orderIndex })
      .from(subjects)
      .where(eq(subjects.id, parseInt(id)));
    if (oldOrderIndex.orderIndex === null) {
      return res.status(400).json({ error: "Old order index not found" });
    }
    await db
      .update(subjects)
      .set({ orderIndex: sql`${subjects.orderIndex} - 1` })
      .where(gt(subjects.orderIndex, oldOrderIndex.orderIndex as number));
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
    const [oldOrderIndex] = await db
      .select({ orderIndex: lessons.orderIndex })
      .from(lessons)
      .where(eq(lessons.id, parseInt(id)));
    if (oldOrderIndex.orderIndex === null) {
      return res.status(400).json({ error: "Old order index not found" });
    }
    await db
      .update(lessons)
      .set({ orderIndex: sql`${lessons.orderIndex} - 1` })
      .where(gt(lessons.orderIndex, oldOrderIndex.orderIndex as number));
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
    const { title, lessonId, orderIndex, insertType, exerciseId } = req.body;
    let finalOrderIndex = orderIndex;

    if (orderIndex !== undefined && insertType === "before") {
      await db
        .update(topics)
        .set({ orderIndex: sql`${topics.orderIndex} + 1` })
        .where(gte(topics.orderIndex, parseInt(orderIndex)));
      finalOrderIndex = parseInt(orderIndex);
    } else if (orderIndex !== undefined && insertType === "after") {
      await db
        .update(topics)
        .set({ orderIndex: sql`${topics.orderIndex} + 1` })
        .where(gt(topics.orderIndex, parseInt(orderIndex)));
      finalOrderIndex = parseInt(orderIndex) + 1;
    }

    const topicData: any = {
      title,
      lessonId,
      component: "[]",
      componentCode: "",
      orderIndex: finalOrderIndex,
    };

    if (exerciseId !== undefined) {
      topicData.exerciseId = exerciseId;
    }

    await db.insert(topics).values(topicData);
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
    const { gradeKhmer, orderIndex, insertType } = req.body;
    let finalOrderIndex = orderIndex;

    if (orderIndex !== undefined && insertType === "before") {
      await db
        .update(grades)
        .set({ orderIndex: sql`${grades.orderIndex} + 1` })
        .where(gte(grades.orderIndex, parseInt(orderIndex)));
      finalOrderIndex = parseInt(orderIndex);
    } else if (orderIndex !== undefined && insertType === "after") {
      await db
        .update(grades)
        .set({ orderIndex: sql`${grades.orderIndex} + 1` })
        .where(gt(grades.orderIndex, parseInt(orderIndex)));
      finalOrderIndex = parseInt(orderIndex) + 1;
    }

    await db
      .insert(grades)
      .values({ gradeKhmer: gradeKhmer, orderIndex: finalOrderIndex });
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
    const { title, icon, gradeId, orderIndex, insertType } = req.body;
    let finalOrderIndex = orderIndex;

    if (orderIndex !== undefined && insertType === "before") {
      await db
        .update(subjects)
        .set({ orderIndex: sql`${subjects.orderIndex} + 1` })
        .where(gte(subjects.orderIndex, parseInt(orderIndex)));
      finalOrderIndex = parseInt(orderIndex);
    } else if (orderIndex !== undefined && insertType === "after") {
      await db
        .update(subjects)
        .set({ orderIndex: sql`${subjects.orderIndex} + 1` })
        .where(gt(subjects.orderIndex, parseInt(orderIndex)));
      finalOrderIndex = parseInt(orderIndex) + 1;
    }

    await db.insert(subjects).values({
      title,
      icon,
      gradeId,
      orderIndex: finalOrderIndex,
    });
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
    const { title, icon, subjectId, orderIndex, insertType } = req.body;
    let finalOrderIndex = orderIndex;

    if (orderIndex !== undefined && insertType === "before") {
      await db
        .update(lessons)
        .set({ orderIndex: sql`${lessons.orderIndex} + 1` })
        .where(gte(lessons.orderIndex, parseInt(orderIndex)));
      finalOrderIndex = parseInt(orderIndex);
    } else if (orderIndex !== undefined && insertType === "after") {
      await db
        .update(lessons)
        .set({ orderIndex: sql`${lessons.orderIndex} + 1` })
        .where(gt(lessons.orderIndex, parseInt(orderIndex)));
      finalOrderIndex = parseInt(orderIndex) + 1;
    }

    await db.insert(lessons).values({
      title,
      icon,
      subjectId,
      orderIndex: finalOrderIndex,
    });
    res.json({ message: "Lesson lesson created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create lesson lesson" + error });
  }
};
