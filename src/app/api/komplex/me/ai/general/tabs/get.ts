import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";
import * as aiGeneralService from "@/app/api/v1/komplex/services/me/ai/general/service.js";

export const getAllAiGeneralTabs = async (
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
    return getResponseError(res, error);
  }
};
