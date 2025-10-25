import { Request, Response } from "express";
import * as blogsService from "../services/blogs/service.js";
import * as blogByIdService from "../services/blogs/[id]/service.js";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    // add other user properties if needed
  };
}

export const postBlog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let public_url: string | null = null;
    let mediaType: "image" | "video" | null = null;

    const { userId } = req.user ?? {};
    const { title, description, type, topic } = req.body;

    try {
      const newBlog = await blogsService.postBlog(
        Number(userId),
        title,
        description,
        type,
        topic,
        public_url || undefined,
        mediaType || undefined
      );

      return res.status(201).json(newBlog);
    } catch (dbError) {
      return res
        .status(500)
        .json({ success: false, error: (dbError as Error).message });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: (error as Error).message });
  }
};

export const getAllBlogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, topic } = req.query;
    const blogWithMedia = await blogsService.getAllBlogs(
      type as string,
      topic as string
    );

    return res.status(200).json(blogWithMedia);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getBlogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const blog = await blogByIdService.getBlogById(parseInt(id));

    return res.json(blog).status(200);
  } catch (error) {
    if ((error as Error).message === "Blog not found") {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const likeBlog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.body;
    const { userId } = req.user ?? {};

    const blog = await blogByIdService.likeBlog(Number(id), Number(userId));

    return res.json(blog).status(200);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if ((error as Error).message === "Blog not found") {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getSavedBlogs = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = 1; // TO CHANGE

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const savedBlogsWithUser = await blogByIdService.getSavedBlogs(
      parseInt(id)
    );

    return res.status(200).json(savedBlogsWithUser);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if ((error as Error).message === "Blog not found") {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};
