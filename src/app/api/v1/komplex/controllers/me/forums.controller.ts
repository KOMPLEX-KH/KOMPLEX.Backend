import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import * as forumService from "@/app/api/v2/komplex/services/me/forums/service.js";
import * as forumByIdService from "@/app/api/v2/komplex/services/me/forums/[id]/service.js";
import { getResponseError } from "@/utils/responseError.js";

export const getAllMyForumsController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const result = await forumService.getAllMyForums(req.query, Number(userId));
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const postForumController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const result = await forumService.postForum(
      req.body,
      req.files,
      Number(userId)
    );
    return res.status(201).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const likeForumController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const result = await forumByIdService.likeForum(id, Number(userId));
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const unlikeForumController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const result = await forumByIdService.unlikeForum(id, Number(userId));
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const updateForumController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await forumByIdService.updateForum(
      id,
      req.body,
      req.files,
      Number(userId)
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const deleteForumController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await forumByIdService.deleteForum(id, Number(userId));
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};
