import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";
import { getSignedUrlFromCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { getResponseError, getResponseSuccess, ResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

export const UploadUrlBodySchema = z
  .object({
    fileName: z.string(),
    fileType: z.string(),
  })
  .openapi("UploadUrlBody");

export const UploadUrlResponseSchema = z
  .object({
    signedUrl: z.string(),
    key: z.string(),
  })
  .openapi("UploadUrlResponse");

export const postUploadUrl = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { fileName, fileType } = await UploadUrlBodySchema.parseAsync(req.body);
    const userId = req.user.userId;

    if (!fileName || !fileType) {
      return getResponseError(
        res,
        new ResponseError("fileName and fileType are required", 400)
      );
    }

    const { signedUrl, key } = await getSignedUrlFromCloudflare(
      fileName,
      fileType,
      userId
    );

    return getResponseSuccess(res, UploadUrlResponseSchema.parse({ signedUrl, key }), "Upload URL fetched successfully");
  } catch (error) {
    return getResponseError(res, error);
  }
};
