import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";
import * as aiGeneralServiceById from "@/app/api/v1/komplex/services/me/ai/general/tabs/[id]/service.js";

export const getAiGeneralTabHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { page, limit } = req.query;

    const result = await aiGeneralServiceById.getAiHistoryByTabService(
      Number(userId),
      Number(id),
      Number(page),
      Number(limit)
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error);
  }
};
