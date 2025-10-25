import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";
import * as gradeService from "@/app/komplex.admin/services/curriculums/grades/service.js";
import * as gradeByIdService from "@/app/komplex.admin/services/curriculums/grades/[id]/service.js";
import * as subjectService from "@/app/komplex.admin/services/curriculums/subjects/service.js";
import * as subjectByIdService from "@/app/komplex.admin/services/curriculums/subjects/[id]/service.js";
import * as lessonService from "@/app/komplex.admin/services/curriculums/lessons/service.js";
import * as lessonByIdService from "@/app/komplex.admin/services/curriculums/lessons/[id]/service.js";
import * as topicService from "@/app/komplex.admin/services/curriculums/topic/service.js";
import * as topicByIdService from "@/app/komplex.admin/services/curriculums/topic/[id]/service.js";
import * as topicComponentService from "@/app/komplex.admin/services/curriculums/topic/[id]/service.js";
import * as dashboardService from "@/app/komplex.admin/services/curriculums/dashboard/service.js";

export const getDashboardData = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const data = await dashboardService.getDashboardData();
    res.status(200).json({ data: data, isSuccess: true });
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Failed to get dashboard data" + error,
        isSuccess: false,
      });
  }
};

export const updateTopicComponent = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { component, componentCode } = req.body;
    await topicComponentService.updateTopicComponent(
      parseInt(id),
      component,
      componentCode
    );
    res.json({ message: "Lesson updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update lesson" + error });
  }
};

export const updateTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newName, orderIndex, insertType } = req.body;
    await topicByIdService.updateTopic(
      parseInt(id),
      newName,
      orderIndex,
      insertType
    );
    res.json({ message: " topic updated successfully" });
  } catch (error) {
    if ((error as Error).message.includes("Old order index not found")) {
      return res.status(400).json({ error: "Old order index not found" });
    }
    res.status(500).json({ error: "Failed to update  topic" + error });
  }
};

export const updateGrade = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newName, orderIndex, insertType } = req.body;
    await gradeByIdService.updateGrade(
      parseInt(id),
      newName,
      orderIndex,
      insertType
    );
    res.json({ message: " grade updated successfully" });
  } catch (error) {
    if ((error as Error).message.includes("Old order index not found")) {
      return res.status(400).json({ error: "Old order index not found" });
    }
    res.status(500).json({ error: "Failed to update  grade" + error });
  }
};

export const updateSubject = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { newName, orderIndex, insertType, icon } = req.body;
    await subjectByIdService.updateSubject(
      parseInt(id),
      newName,
      orderIndex,
      insertType,
      icon
    );
    res.json({ message: " subject updated successfully" });
  } catch (error) {
    if ((error as Error).message.includes("Old order index not found")) {
      return res.status(400).json({ error: "Old order index not found" });
    }
    res.status(500).json({ error: "Failed to update  subject" + error });
  }
};

export const updateLesson = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { newName, orderIndex, insertType, icon } = req.body;
    await lessonByIdService.updateLesson(
      parseInt(id),
      newName,
      orderIndex,
      insertType,
      icon
    );
    res.json({ message: "Lesson lesson updated successfully" });
  } catch (error) {
    if ((error as Error).message.includes("Old order index not found")) {
      return res.status(400).json({ error: "Old order index not found" });
    }
    res.status(500).json({ error: "Failed to update lesson lesson" + error });
  }
};

export const deleteTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await topicByIdService.deleteTopic(parseInt(id));
    res.json({ message: " topic deleted successfully" });
  } catch (error) {
    if ((error as Error).message.includes("Old order index not found")) {
      return res.status(400).json({ error: "Old order index not found" });
    }
    res.status(500).json({ error: "Failed to delete  topic" + error });
  }
};

export const deleteGrade = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await gradeByIdService.deleteGrade(parseInt(id));
    res.json({ message: " grade deleted successfully" });
  } catch (error) {
    if ((error as Error).message.includes("Old order index not found")) {
      return res.status(400).json({ error: "Old order index not found" });
    }
    res.status(500).json({ error: "Failed to delete  grade" + error });
  }
};

export const deleteSubject = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    await subjectByIdService.deleteSubject(parseInt(id));
    res.json({ message: " subject deleted successfully" });
  } catch (error) {
    if ((error as Error).message.includes("Old order index not found")) {
      return res.status(400).json({ error: "Old order index not found" });
    }
    res.status(500).json({ error: "Failed to delete  subject" + error });
  }
};
export const deleteLesson = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    await lessonByIdService.deleteLesson(parseInt(id));
    res.json({ message: " lesson deleted successfully" });
  } catch (error) {
    if ((error as Error).message.includes("Old order index not found")) {
      return res.status(400).json({ error: "Old order index not found" });
    }
    res.status(500).json({ error: "Failed to delete  lesson" + error });
  }
};

export const createTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, lessonId, orderIndex, insertType, exerciseId } = req.body;
    await topicService.createTopic(
      title,
      lessonId,
      orderIndex,
      insertType,
      exerciseId
    );
    res.json({ message: " topic created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create lesson topic" + error });
  }
};
export const createGrade = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { gradeKhmer, orderIndex, insertType } = req.body;
    await gradeService.createGrade(gradeKhmer, orderIndex, insertType);
    res.json({ message: " grade created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create  grade" + error });
  }
};
export const createSubject = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { title, icon, gradeId, orderIndex, insertType } = req.body;
    await subjectService.createSubject(
      title,
      icon,
      gradeId,
      orderIndex,
      insertType
    );
    res.json({ message: " subject created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create  subject" + error });
  }
};

export const createLesson = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { title, icon, subjectId, orderIndex, insertType } = req.body;
    await lessonService.createLesson(
      title,
      icon,
      subjectId,
      orderIndex,
      insertType
    );
    res.json({ message: " lesson created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create  lesson" + error });
  }
};
