import { Response } from "express";
import { getUserProfile } from "@/app/api/v2/komplex/services/users/profile/service.js";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError} from "@/utils/responseError.js";
export const getUserProfileController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    if (!id) {
      return getResponseError(res, new ResponseError("User ID is required", 400));
    }
    const userProfile = await getUserProfile(Number(id));
    return res.status(200).json(userProfile);
  } catch (error) {
    return getResponseError(res, error );
  }
};
