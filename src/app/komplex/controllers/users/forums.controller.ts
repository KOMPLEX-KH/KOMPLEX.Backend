import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import * as forumService from "@/app/komplex/services/users/forums/service.js";
import { getResponseError, ResponseError, responseError } from "@/utils/responseError.js";
export const getUserForumsController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    if (!id) {
      return responseError(res, new ResponseError("User ID is required", 400));
    }

    const result = await forumService.getUserForums(Number(id));
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
