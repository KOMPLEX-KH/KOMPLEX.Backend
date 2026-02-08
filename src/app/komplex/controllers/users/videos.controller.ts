import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import * as videoService from "@/app/komplex/services/users/videos/service.js";
import { getResponseError, ResponseError, responseError } from "@/utils/responseError.js";
export const getUserVideosController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    if (!id) {
      return responseError(res, new ResponseError("User ID is required", 400));
    }

    const result = await videoService.getUserVideos(Number(id));
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
