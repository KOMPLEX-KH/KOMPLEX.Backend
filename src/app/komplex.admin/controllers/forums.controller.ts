import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../../types/request.js";
import * as forumsService from "../services/forums/service.js";
import * as forumByIdService from "../services/forums/[id]/service.js";

export const getAllForums = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, topic } = req.query;

    const forumsWithDetails = await forumsService.getAllForums(
      type as string,
      topic as string
    );

    return res.status(200).json(forumsWithDetails);
  } catch (error) {
    console.error("Get all forums error:", error);
    return res.status(500).json({
      success: false,
      error: (error ).message,
    });
  }
};

export const getForumById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const forum = await forumByIdService.getForumById(Number(id));

    return res.json(forum).status(200);
  } catch (error) {
    if ((error ).message === "Forum not found") {
      return res
        .status(404)
        .json({ success: false, message: "Forum not found" });
    }
    return res.status(500).json({
      success: false,
      error: (error ).message,
    });
  }
};

export const updateForum = async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.user ?? {};

  try {
    let public_url: string | null = null;
    let mediaType: "image" | "video" | null = null;

    const { title, description, type, topic } = req.body;
    const { id } = req.params;

    const result = await forumByIdService.updateForum(
      Number(id),
      Number(userId),
      title,
      description,
      type,
      topic,
      public_url || undefined,
      mediaType || undefined
    );

    return res.status(200).json(result);
  } catch (error) {
    if ((error ).message === "Forum not found") {
      return res
        .status(404)
        .json({ success: false, message: "Forum not found" });
    }
    return res.status(500).json({
      success: false,
      error: (error ).message,
    });
  }
};

export const deleteForum = async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.user ?? {};

  try {
    const { id } = req.params;

    const result = await forumByIdService.deleteForum(Number(id), Number(userId));

    return res.status(200).json(result);
  } catch (error) {
    if ((error ).message === "Forum not found") {
      return res
        .status(404)
        .json({ success: false, message: "Forum not found" });
    }
    return res.status(500).json({
      success: false,
      error: (error ).message,
    });
  }
};
