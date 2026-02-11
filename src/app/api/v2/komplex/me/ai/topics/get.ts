import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";
import * as getAllAiTopicNamesService from "@/app/api/v1/komplex/services/me/ai/topics/service.js";

export const getAllAiTopics = async (
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
    return getResponseError(res, error);
  }
};
