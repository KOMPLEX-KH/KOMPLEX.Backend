import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import * as videoCommentService from "@/app/api/v2/komplex/services/me/video-comments/service.js";
import * as videoCommentByIdService from "@/app/api/v2/komplex/services/me/video-comments/[id]/service.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
export const postVideoCommentController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { description } = req.body;
    const { id } = req.params;
    const files = req.files;

    const result = await videoCommentService.postVideoComment(
      id,
      userId,
      description,
      files
    );

    return res.status(201).json(result.data);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const updateVideoCommentController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { description, mediasToRemove } = req.body;
    const files = req.files;

    const result = await videoCommentByIdService.updateVideoComment(
      id,
      userId,
      description,
      mediasToRemove,
      files
    );

    return res.status(200).json(result.data);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const deleteVideoCommentController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const result = await videoCommentByIdService.deleteVideoComment(id, userId);

    return res.status(200).json(result.data);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const likeVideoCommentController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return getResponseError(res, new ResponseError("Unauthorized", 401));
    }

    const result = await videoCommentByIdService.likeVideoComment(id, userId);

    return res.status(200).json(result.data);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const unlikeVideoCommentController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return getResponseError(res, new ResponseError("Unauthorized", 401));
    }

    const result = await videoCommentByIdService.unlikeVideoComment(id, userId);

    return res.status(200).json(result.data);
  } catch (error) {
    return getResponseError(res, error );
  }
};
