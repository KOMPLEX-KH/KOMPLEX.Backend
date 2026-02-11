import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";
import * as followServiceById from "@/app/api/v2/komplex/services/me/follow/[id]/service.js";
import * as followService from "@/app/api/v2/komplex/services/me/follow/service.js";
import { getResponseError } from "@/utils/responseError.js";

export const getUserFollowersController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { page, limit, offset } = req.query;

    const result = await followService.getFollowersService(
      Number(userId),
      Number(page),
      Number(limit),
      Number(offset)
    );

    res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const followUserController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    await followServiceById.followUserService(Number(userId), Number(id));
    res.status(200).json({ message: "Successfully followed the user." });
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const unfollowUserController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    await followServiceById.unfollowUserService(Number(userId), Number(id));
    return res.status(200).json({ message: "Successfully unfollowed the user." });
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const getFollowingController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { page, limit, offset } = req.query;

    const result = await followService.getFollowingService(
      Number(userId),
      Number(page),
      Number(limit),
      Number(offset)
    );

    res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error );
  }
};
