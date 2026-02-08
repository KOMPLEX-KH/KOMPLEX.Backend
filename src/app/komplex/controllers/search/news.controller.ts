import { AuthenticatedRequest } from "@/types/request.js";
import { Request, Response } from "express";
import { searchNews } from "../../services/search/news/service.js";
import { getResponseError, ResponseError, responseError } from "@/utils/responseError.js";

export const newsSearchController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { query, limit = "10", offset = "0" } = req.query;
    if (!query || query.trim() === "") {
        return responseError(res, new ResponseError("Query parameter is required", 400));
    }
    const result = await searchNews(
      query as string,
      Number(limit),
      Number(offset),
      Number(userId)
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
