import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";
import * as aiGeneralServiceById from "@/app/api/v1/komplex/services/me/ai/general/tabs/[id]/service.js";

export const deleteAiGeneralTab = async (
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
    return getResponseError(res, error);
  }
};
