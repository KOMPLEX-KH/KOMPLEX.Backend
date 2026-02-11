import { Request, Response } from "express";
import {
  getGeneralAiResponses,
  getGeneralAiResponseById,
} from "../services/ai/general/service.js";
import {
  getTopicAiResponses,
  getTopicAiResponseById,
} from "../services/ai/topics/service.js";
import { getGeneralAiDashboard } from "../services/ai/general/dashboard/service.js";
import { getTopicAiDashboard } from "../services/ai/topics/dashboard/service.js";
import { getAiDashboard } from "../services/ai/dashboard/service.js";

export const getGeneralAiResponsesController = async (
  req: Request,
  res: Response,
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
  res: Response,
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
  res: Response,
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
  res: Response,
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

export const getGeneralAiResponseByIdController = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid ID parameter",
      });
    }
    const result = await getGeneralAiResponseById(id);
    return res.status(200).json(result);
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: errorMessage,
      });
    }
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

export const getTopicAiResponseByIdController = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid ID parameter",
      });
    }
    const result = await getTopicAiResponseById(id);
    return res.status(200).json(result);
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: errorMessage,
      });
    }
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};
