import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";
import { searchVideosService } from "../../services/search/videos/service.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";

export const videoSearchController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { query, limit = "10", offset = "0" } = req.query;
    if (!query || query.trim() === "") {
      return getResponseError(res, new ResponseError("Query parameter is required", 400));
    }
    const result = await searchVideosService(
      query as string,
      Number(limit),
      Number(offset),
      Number(userId)
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};
