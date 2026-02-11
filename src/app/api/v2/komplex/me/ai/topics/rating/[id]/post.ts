import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";
import * as aiTopicRatingService from "@/app/api/v1/komplex/services/me/ai/topics/[id]/rating/service.js";

export const rateAiTopicResponse = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { rating, ratingFeedback } = req.body;

    const result = await aiTopicRatingService.rateAiTopicResponse(
      id,
      Number(rating),
      ratingFeedback
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error);
  }
};
