import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import * as aiService from "@/app/komplex/services/me/ai/service.js";
import * as aiServiceById from "@/app/komplex/services/me/ai/topics/[id]/service.js";
import * as aiRatingService from "@/app/komplex/services/me/ai/[id]/rating/service.js";
import * as aiTopicRatingService from "@/app/komplex/services/me/ai/topics/[id]/rating/service.js";

export const callAiAndWriteToHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { prompt, responseType } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    const result = await aiService.callAiAndWriteToHistory(
      prompt,
      responseType,
      Number(userId)
    );

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getMyAiHistoryController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { page, limit } = req.query;

    const result = await aiService.getAiHistory(
      Number(userId),
      Number(page),
      Number(limit)
    );

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getAiTopicResponseController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { prompt } = req.body;
    const { responseType } = req.body;
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }
    if (!responseType) {
      return res.status(400).json({
        success: false,
        message: "Response type is required",
      });
    }
    const result = await aiServiceById.callAiTopicAndWriteToTopicHistory(
      prompt,
      responseType,
      Number(userId),
      id
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getAiTopicHistoryController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { page, limit } = req.query;
    const result = await aiServiceById.getAiTopicHistory(
      Number(userId),
      id,
      Number(page),
      Number(limit)
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const rateAiResponseController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { rating, ratingFeedback } = req.body;
    const result = await aiRatingService.rateAiResponse(
      id,
      Number(rating),
      ratingFeedback
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const rateAiTopicResponseController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { rating, ratingFeedback } = req.body;
    const result = await aiTopicRatingService.rateAiTopicResponse(
      id,
      Number(rating),
      ratingFeedback
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};
