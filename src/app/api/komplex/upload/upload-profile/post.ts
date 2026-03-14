import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";
import { getSignedUrlFromCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { sendResponseError, sendResponseSuccess, ResponseError } from "@/utils/response.js";
import { z } from "@/config/openapi/openapi.js";

export const UploadProfileBodySchema = z
  .object({
    fileName: z.string(),
    fileType: z.string(),
  })
  .openapi("UploadProfileBody");

export const UploadProfileResponseSchema = z
  .object({
    signedUrl: z.string(),
    key: z.string(),
    publicUrl: z.string(),
  })
  .openapi("UploadProfileResponse");

export const postUploadProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { fileName, fileType } = await UploadProfileBodySchema.parseAsync(req.body);

    if (!fileName || !fileType) {
      return sendResponseError(
        res,
        new ResponseError("fileName and fileType are required", 400)
      );
    }

    const { signedUrl, key, publicUrl } = await getSignedUrlFromCloudflare(
      fileName,
      fileType,
    );

    return sendResponseSuccess(res, UploadProfileResponseSchema.parse({ signedUrl, key, publicUrl }), "Upload URL fetched successfully");
  } catch (error) {
    return sendResponseError(res, error);
  }
};
