import { Request, Response } from "express";
import * as videosService from "../services/videos/service.js";
import * as videoByIdService from "../services/videos/[id]/service.js";

export const getAllVideos = async (req: Request, res: Response) => {
  try {
    const { page } = req.query;
    const pageNumber = Number(page) || 1;

    const videosWithStats = await videosService.getAllVideos(pageNumber);

    return res.status(200).json(videosWithStats);
  } catch (error: any) {
    console.error("Get all videos error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getVideoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const video = await videoByIdService.getVideoById(Number(id));

    return res.status(200).json(video);
  } catch (error: any) {
    console.error("Get video by id error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
