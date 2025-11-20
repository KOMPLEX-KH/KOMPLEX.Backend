import { Request, Response } from "express";
import { getGeneralAiResponses } from "../services/ai/general/service.js";
import { getTopicAiResponses } from "../services/ai/topics/service.js";
import { getGeneralAiDashboard } from "../services/ai/general/dashboard/service.js";
import { getTopicAiDashboard } from "../services/ai/topics/dashboard/service.js";
import { getAiDashboard } from "../services/ai/dashboard/service.js";

export const getGeneralAiResponsesController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await getGeneralAiResponses();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getTopicAiResponsesController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await getTopicAiResponses();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getGeneralAiDashboardController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await getGeneralAiDashboard();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getTopicAiDashboardController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await getTopicAiDashboard();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getAiDashboardController = async (req: Request, res: Response) => {
  try {
    const result = await getAiDashboard();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};
