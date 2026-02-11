import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";
import * as aiGeneralRatingService from "@/app/api/v1/komplex/services/me/ai/general/tabs/[id]/rating/service.js";

export const rateAiGeneralResponse = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { rating, ratingFeedback } = req.body;

    const result = await aiGeneralRatingService.rateAiResponse(
      id,
      Number(rating),
      ratingFeedback
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error);
  }
};
