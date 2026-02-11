import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import * as aiTopicServiceById from "@/app/api/v1/komplex/services/me/ai/topics/[id]/service.js";

export const callAiTopic = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { prompt, responseType } = req.body;
    const { id } = req.params;

    if (!prompt) {
      return getResponseError(res, new ResponseError("Prompt is required", 400));
    }

    const result = await aiTopicServiceById.callAiTopicAndWriteToTopicHistory(
      prompt,
      responseType,
      Number(userId),
      id
    );
    return res.status(200).json({
      success: true,
      message: "AI topic called successfully",
      data: result,
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
