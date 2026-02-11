import { Request, Response } from "express";
import * as feedbacksService from "../services/feedbacks/service.js";
import * as feedbackByIdService from "../services/feedbacks/[id]/service.js";

export const getFeedbacks = async (req: Request, res: Response) => {
  try {
    const { page, status, type } = req.query;
    const pageNumber = Number(page) || 1;

    const result = await feedbacksService.getFeedbacks(
      pageNumber,
      status as string,
      type as string
    );

    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to get feedbacks" });
  }
};

export const updateFeedbackStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await feedbackByIdService.updateFeedbackStatus(
      Number(id),
      status
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to update feedback status" });
  }
};
