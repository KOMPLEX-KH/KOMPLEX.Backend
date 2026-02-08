import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import * as videoService from "@/app/komplex/services/feed/videos/service.js";
import * as videoByIdService from "@/app/komplex/services/feed/videos/[id]/service.js";
import { getResponseError } from "@/utils/responseError.js";

export const getAllVideosController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { type, topic, page } = req.query;
    const result = await videoService.getAllVideos(
      type as string,
      topic as string,
      page as string,
      Number(userId)
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const getVideoByIdController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const videoId = Number(req.params.id);
    const result = await videoByIdService.getVideoById(videoId, Number(userId));
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const getRecommendedVideosController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { limit, offset } = req.query;
    const { id } = req.params;
    const result = await videoByIdService.getRecommendedVideos(
      Number(userId),
      Number(id),
      Number(limit),
      Number(offset)
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};
