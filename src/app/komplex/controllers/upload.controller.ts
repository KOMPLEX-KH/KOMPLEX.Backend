import { AuthenticatedRequest } from "../../../types/request.js";
import { Response } from "express";
import { getSignedUrlFromCloudflare } from "../../../db/cloudflare/cloudflareFunction.js";
import { getResponseError, ResponseError, responseError } from "@/utils/responseError.js";
export const getSignedUrl = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { fileName, fileType } = req.body;
    // user already checked at middleware
    const userId = req.user.userId || 0;

    if (!fileName || !fileType) {
      return responseError(res, new ResponseError("fileName and fileType are required", 400));
    }

    const { signedUrl, key } = await getSignedUrlFromCloudflare(
      fileName,
      fileType,
      userId
    );

    return res.status(200).json({ signedUrl, key });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
