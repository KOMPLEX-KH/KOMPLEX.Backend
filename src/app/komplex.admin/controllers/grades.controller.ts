import { Request, Response } from "express";
import * as gradesService from "../services/grades/service.js";

export const getGrades = async (req: Request, res: Response) => {
  try {
    const grades = await gradesService.getGrades();
    res.status(200).json(grades);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
};
