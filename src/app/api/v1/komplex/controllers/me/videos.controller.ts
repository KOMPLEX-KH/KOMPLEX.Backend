import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import * as videoService from "@/app/api/v2/komplex/services/me/videos/service.js";
import * as videoByIdService from "@/app/api/v2/komplex/services/me/videos/[id]/service.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
export const getAllMyVideosController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const result = await videoService.getAllMyVideos(req.query, Number(userId));
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const likeVideoController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const result = await videoByIdService.likeVideo(Number(id), Number(userId));
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const unlikeVideoController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const result = await videoByIdService.unlikeVideo(
      Number(id),
      Number(userId)
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const saveVideoController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const result = await videoByIdService.saveVideo(Number(id), Number(userId));
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const unsaveVideoController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const result = await videoByIdService.unsaveVideo(
      Number(id),
      Number(userId)
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const updateVideoController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!id || !req.body.title || !req.body.description) {
      return getResponseError(res, new ResponseError("Missing required fields", 400));
    }

    const { title, description, videoKey, thumbnailKey, questions } = req.body;

    const result = await videoByIdService.updateVideo(
      Number(id),
      Number(userId),
      {
        title,
        description,
        videoKey,
        thumbnailKey,
        questions,
      }
    );
    return res.status(200).json(result);
  } catch (error) {
      return getResponseError(res, error );
  }
};

export const deleteVideoController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  let result;
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    result = await videoByIdService.deleteVideo(Number(id), Number(userId));
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const getMyVideoHistoryController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const result = await videoService.getMyVideoHistory(Number(userId));
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const postVideoController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const result = await videoService.postVideo(req.body, Number(userId));
    return res.status(201).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};
