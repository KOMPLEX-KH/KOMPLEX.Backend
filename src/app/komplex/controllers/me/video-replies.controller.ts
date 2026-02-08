import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import * as videoReplyService from "@/app/komplex/services/me/video-replies/service.js";
import * as videoReplyByIdService from "@/app/komplex/services/me/video-replies/[id]/service.js";
import { getResponseError, ResponseError, responseError } from "@/utils/responseError.js";
export const postVideoReplyController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { description } = req.body;
    const { id } = req.params;
    const files = req.files;

    const result = await videoReplyService.postVideoReply(
      id,
      userId,
      description,
      files
    );

    return res.status(201).json(result.data);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

export const updateVideoReplyController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { description, videosToRemove } = req.body;
    const files = req.files;

    const result = await videoReplyByIdService.updateVideoReply(
      id,
      userId,
      description,
      videosToRemove,
      files
    );

    return res.status(200).json(result.data);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

export const deleteVideoReplyController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const result = await videoReplyByIdService.deleteVideoReply(id, userId);

    return res.status(200).json(result.data);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

export const likeVideoReplyController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return responseError(res, new ResponseError("Unauthorized", 401));
    }

    const result = await videoReplyByIdService.likeVideoReply(id, userId);

    return res.status(200).json(result.data);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

export const unlikeVideoReplyController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return responseError(res, new ResponseError("Unauthorized", 401));
    }

    const result = await videoReplyByIdService.unlikeVideoReply(id, userId);

    return res.status(200).json(result.data);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
