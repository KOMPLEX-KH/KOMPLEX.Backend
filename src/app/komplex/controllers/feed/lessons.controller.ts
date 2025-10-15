import { Request, Response } from "express";
import * as lessonsService from "@/app/komplex/services/feed/lessons/service.js";
import * as topicService from "@/app/komplex/services/feed/lessons/[id]/service.js";

export const getLessons = async (req: Request, res: Response) => {
  try {
    const result = await lessonsService.getAllLessons();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await topicService.getTopic(id);
    return res.status(200).json(result);
  } catch (error) {
    if ((error as Error).message === "Topic not found") {
      return res
        .status(404)
        .json({ success: false, message: "Topic not found" });
    }
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};
