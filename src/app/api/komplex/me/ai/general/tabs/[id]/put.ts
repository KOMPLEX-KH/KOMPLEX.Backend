import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";
import * as aiGeneralServiceById from "@/app/api/v1/komplex/services/me/ai/general/tabs/[id]/service.js";

export const updateAiGeneralTab = async (
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
    return getResponseError(res, error);
  }
};
