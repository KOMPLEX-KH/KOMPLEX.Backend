import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import * as getAllAiTopicNamesService from "@/app/komplex/services/me/ai/topics/service.js";
import * as aiTopicServiceById from "@/app/komplex/services/me/ai/topics/[id]/service.js";
import * as aiGeneralRatingService from "@/app/komplex/services/me/ai/general/tabs/[id]/rating/service.js";
import * as aiGeneralServiceById from "@/app/komplex/services/me/ai/general/tabs/[id]/service.js";
import * as aiTopicRatingService from "@/app/komplex/services/me/ai/topics/[id]/rating/service.js";
import * as aiGeneralService from "@/app/komplex/services/me/ai/general/service.js";
import { getResponseError } from "@/utils/responseError.js";
import { ResponseError, responseError } from "@/utils/responseError.js";


export const callAiGeneralAndWriteToHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { prompt, responseType } = req.body;
    const { tabId } = req.params;
    if (!prompt || !tabId) {
      return responseError(res, new ResponseError("Prompt is required", 400));
    }

    const result = await aiGeneralServiceById.callAiGeneralService(
      prompt,
      responseType,
      Number(userId),
      Number(tabId)
    );

    return res.status(200).json({
      success: true,
      message: "AI general called successfully",
      data: result,
    });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

export const callAiTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const { prompt, responseType } = req.body;
    const { topicId } = req.params;
    if (!prompt) {
        return responseError(res, new ResponseError("Prompt is required", 400));
    }
    const result = await aiTopicServiceById.callAiTopicAndWriteToTopicHistory(
      prompt,
      responseType,
      Number(userId),
      topicId
    );
    return res.status(200).json({
      success: true,
      message: "AI topic called successfully",
      data: result,
    });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

export const callAiGeneralFirstTime = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { prompt, responseType } = req.body;

    if (!prompt || !responseType) {
      return responseError(res, new ResponseError("Prompt and response type are required", 400));
    }
    const result = await aiGeneralService.callAiFirstTimeService(
      prompt,
      responseType,
      Number(userId)
    );
    return res.status(200).json({
      success: true,
      message: "AI general first time called successfully",
      data: result,
    });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

export const getAllAiGeneralTabNames = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { page, limit } = req.query;

    const result = await aiGeneralService.getAllAiTabNamesService(
      Number(userId),
      Number(page),
      Number(limit)
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

export const getAllAiTopicNames = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const result = await getAllAiTopicNamesService.getAllAiTopicNamesService(
      Number(userId)
    );
    return res.status(200).json({
      data: result,
      success: true,
      message: "AI topic names fetched successfully",
    });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

export const getAiGeneralHistoryBasedOnTab = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { tabId } = req.params;
    const { page, limit } = req.query;

    const result = await aiGeneralServiceById.getAiHistoryByTabService(
      Number(userId),
      Number(tabId),
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

export const getAiGeneralHistoryBasedOnTopic = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { topicId } = req.params;
    const { page, limit } = req.query;
    const result = await aiTopicServiceById.getAiTopicHistory(
      Number(userId),
      Number(topicId),
      Number(page),
      Number(limit)
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

export const getAiTopicResponse = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { topicId } = req.params;
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
    const result = await aiTopicServiceById.callAiTopicAndWriteToTopicHistory(
      prompt,
      responseType,
      Number(userId),
      topicId
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

export const getAiTopicHistoryController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { topicId } = req.params;
    const { page, limit, offset } = req.query;
    const result = await aiTopicServiceById.getAiTopicHistory(
      Number(userId),
      Number(topicId),
      Number(page),
      Number(limit),
      Number(offset)
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const rateAiGeneralResponseController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { rating, ratingFeedback } = req.body;
    const result = await aiGeneralRatingService.rateAiResponse(
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
    return getResponseError(res, error as Error);
  }
};

export const deleteAiGeneralTabController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const result = await aiGeneralServiceById.deleteAiGeneralTab(
      Number(userId),
      Number(id)
    );
    return res.status(200).json({
      success: true,
      message: "AI general tab deleted successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const editAiGeneralTabController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { tabName } = req.body;
    const result = await aiGeneralServiceById.editAiGeneralTab(
      Number(userId),
      Number(id),
      tabName
    );
    return res.status(200).json({
      success: true,
      message: "AI general tab edited successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const deleteAiTopicTabController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const result = await aiTopicServiceById.deleteAiTopicTab(
      Number(userId),
      Number(id)
    );
    return res.status(200).json({
      success: true,
      message: "AI topic tab deleted successfully",
      data: result,
    });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
