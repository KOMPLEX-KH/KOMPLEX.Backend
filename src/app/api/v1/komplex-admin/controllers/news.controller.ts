import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import * as newsService from "@/app/api/v2/komplex-admin/services/news/service.js";
import * as newsByIdService from "@/app/api/v2/komplex-admin/services/news/[id]/service.js";

export const postNewsController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user.userId;
    const result = await newsService.postNews(
      req.body,
      req.files,
      Number(userId),
    );
    return res.status(201).json(result);
  } catch (error) {
    if ((error as Error).message === "Missing required fields") {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    return res
      .status(500)
      .json({ success: false, error: (error as Error).message });
  }
};

export const updateNewsController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const result = await newsByIdService.updateNews(
      id,
      req.body,
      req.files,
      Number(userId),
    );
    return res.status(200).json(result.data);
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: (error as Error).message });
  }
};

export const deleteNewsController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const result = await newsByIdService.deleteNews(id, Number(userId));
    return res.status(200).json(result.data);
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: (error as Error).message });
  }
};
