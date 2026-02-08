import { db } from "@/db/index.js";
import { users } from "@/db/schema.js";
import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";
import { getLastAccessedService } from "../../services/me/last-accessed/service.js";
import { getResponseError, ResponseError, responseError } from "@/utils/responseError.js";

export const getLastAccessed = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    if (!userId || userId === 0) {
      return responseError(res, new ResponseError("User ID is required", 400));
    }
    const lastAccessed = await getLastAccessedService(userId);
    return res.status(200).json(lastAccessed.data);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};