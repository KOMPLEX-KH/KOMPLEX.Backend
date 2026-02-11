import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import * as aiGeneralService from "@/app/api/v1/komplex/services/me/ai/general/service.js";

export const createAiGeneralTab = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { prompt, responseType } = req.body;

    if (!prompt || !responseType) {
      return getResponseError(res, new ResponseError("Prompt and response type are required", 400));
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
    return getResponseError(res, error);
  }
};
