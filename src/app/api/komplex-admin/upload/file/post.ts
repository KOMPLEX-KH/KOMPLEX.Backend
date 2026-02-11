import { Request, Response } from "express";
import crypto from "crypto";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import {
  uploadPdfToCloudflare,
  uploadImageToCloudflare,
} from "@/db/cloudflare/cloudflareFunction.js";
import { imageMimeTypes } from "@/utils/imageMimeTypes.js";

export const uploadFile = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    const { fileName, fileType } = req.body as {
      fileName: string;
      fileType: string;
    };

    if (!file) {
      throw new ResponseError("No file uploaded", 400);
    }
    if (!fileName || !fileType) {
      throw new ResponseError("fileName and fileType are required", 400);
    }

    const safeFileName = fileName
      .replace(/\s+/g, "_")
      .replace(/[^\p{L}\p{N}._-]+/gu, "_");
    const key = `books/${safeFileName}-${crypto.randomUUID()}`;

    let url: string;
    if (fileType === "application/pdf") {
      url = await uploadPdfToCloudflare(key, file.buffer, fileType);
    } else if (imageMimeTypes.includes(fileType)) {
      url = await uploadImageToCloudflare(key, file.buffer, fileType);
    } else {
      throw new ResponseError("Unsupported file type", 400);
    }

    return res.status(200).json({ key, url });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};