import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import * as forumReplyService from "@/app/komplex/services/me/forum-replies/service.js";
import * as forumReplyByIdService from "@/app/komplex/services/me/forum-replies/[id]/service.js";
import { getResponseError } from "@/utils/responseError.js";
export const postForumReplyController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await forumReplyService.postForumReply(
      id,
      req.body,
      req.files,
      Number(userId)
    );
    return res.status(201).json(result);
  } catch (error) {
   return getResponseError(res, error as Error);
  }
};

export const updateForumReplyController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await forumReplyByIdService.updateForumReply(
      id,
      req.body,
      req.files,
      Number(userId)
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

export const deleteForumReplyController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await forumReplyByIdService.deleteForumReply(
      id,
      Number(userId)
    );
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

export const likeForumReplyController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const result = await forumReplyByIdService.likeForumReply(
      id,
      Number(userId)
    );

    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

export const unlikeForumReplyController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const result = await forumReplyByIdService.unlikeForumReply(
      id,
      Number(userId)
    );

    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
