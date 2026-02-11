import { Request, Response } from "express";
import * as subjectsService from "../services/subjects/service.js";

export const getSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await subjectsService.getSubjects();
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
};
