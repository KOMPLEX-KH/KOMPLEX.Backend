import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import * as newsService from "@/app/komplex/services/feed/news/service.js";
import * as newsByIdService from "@/app/komplex/services/feed/news/[id]/service.js";
import { getResponseError } from "@/utils/responseError.js";

export const getAllNewsController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { type, topic, page } = req.query;
    const result = await newsService.getAllNews(
      type as string,
      topic as string,
      page as string,
      1
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

export const getNewsByIdController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const result = await newsByIdService.getNewsById(id, Number(userId));
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
