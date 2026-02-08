import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import * as forumCommentService from "@/app/komplex/services/me/forum-comments/service.js";
import * as forumCommentByIdService from "@/app/komplex/services/me/forum-comments/[id]/service.js";
import { getResponseError, ResponseError} from "@/utils/responseError.js";
export const updateForumCommentController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const result = await forumCommentByIdService.updateForumComment(
      id,
      req.body,
      req.files,
      Number(userId)
    );
    return res.status(200).json(result.data);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const deleteForumCommentController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const result = await forumCommentByIdService.deleteForumComment(
      id,
      Number(userId)
    );
    return res.status(200).json(result.data);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const postForumCommentController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await forumCommentService.postForumComment(
      id,
      req.body,
      req.files,
      Number(userId)
    );
    return res.status(201).json(result.data);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const likeForumCommentController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!userId) {
      return getResponseError(res, new ResponseError("Unauthorized", 401));
    }

    const result = await forumCommentByIdService.likeForumComment(
      id,
      Number(userId)
    );

    return res.status(200).json(result.data);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const unlikeForumCommentController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!userId) {
      return getResponseError(res, new ResponseError("Unauthorized", 401));
    }

    const result = await forumCommentByIdService.unlikeForumComment(
      id,
      Number(userId)
    );

    return res.status(200).json(result.data);
  } catch (error) {
    return getResponseError(res, error );
  }
};
