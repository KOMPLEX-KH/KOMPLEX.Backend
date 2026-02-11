import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";
import * as aiTopicServiceById from "@/app/api/v1/komplex/services/me/ai/topics/[id]/service.js";

export const getAiTopicHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { page, limit, offset } = req.query;

    const result = await aiTopicServiceById.getAiTopicHistory(
      Number(userId),
      Number(id),
      Number(page),
      Number(limit),
      Number(offset)
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error);
  }
};
