import { Request, Response } from "express";
import * as exercisesService from "../services/exercises/service.js";
import * as exerciseByIdService from "../services/exercises/[id]/service.js";

export const getExercises = async (req: Request, res: Response) => {
  try {
    const { grade } = req.query;
    const result = await exercisesService.getAllExercises(grade as string);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Get exercises error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getExercise = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const exerciseWithQuestions = await exerciseByIdService.getExercise(
      parseInt(id),
    );
    return res.status(200).json(exerciseWithQuestions);
  } catch (error: any) {
    if ((error as Error).message === "Exercise not found") {
      return res.status(404).json({ message: "Exercise not found" });
    }
    console.error("Get exercise error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const createExercise = async (req: Request, res: Response) => {
  try {
    const userId = 1; // TO CHANGE
    const { duration, title, description, subject, grade, exerciseQuestions } =
      req.body;

    const result = await exercisesService.createExercise(
      userId,
      duration,
      title,
      description,
      subject,
      grade,
      exerciseQuestions,
    );

    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error" + error.message });
  }
};

export const deleteExercise = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await exerciseByIdService.deleteExercise(parseInt(id));
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error" + error });
  }
};

export const getExerciseDashboard = async (req: Request, res: Response) => {
  try {
    const cacheData = await exercisesService.getExerciseDashboard();
    res.status(200).json(cacheData);
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error" + error });
  }
};

export const updateExercise = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { duration, title, description, subject, grade, exerciseQuestions } =
      req.body;

    const result = await exerciseByIdService.updateExercise(
      parseInt(id),
      duration,
      title,
      description,
      subject,
      grade,
      exerciseQuestions,
    );

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error" + error });
    console.error("Update exercise error:", error);
  }
};
