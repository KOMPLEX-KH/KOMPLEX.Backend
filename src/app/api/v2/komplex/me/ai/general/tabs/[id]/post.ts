import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import * as aiGeneralServiceById from "@/app/api/v1/komplex/services/me/ai/general/tabs/[id]/service.js";

export const callAiGeneral = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { prompt, responseType } = req.body;
    const { id } = req.params;

    if (!prompt || !id) {
      return getResponseError(res, new ResponseError("Prompt is required", 400));
    }

    const result = await aiGeneralServiceById.callAiGeneralService(
      prompt,
      responseType,
      Number(userId),
      Number(id)
    );

    return res.status(200).json({
      success: true,
      message: "AI general called successfully",
      data: result,
    });
  } catch (error) {
    return getResponseError(res, error);
  }
};
