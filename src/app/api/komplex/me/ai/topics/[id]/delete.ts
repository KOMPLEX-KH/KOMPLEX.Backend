import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";
import * as aiTopicServiceById from "@/app/api/v1/komplex/services/me/ai/topics/[id]/service.js";

export const deleteAiTopic = async (
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
    return getResponseError(res, error);
  }
};
