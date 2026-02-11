import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { forumComments } from "@/db/schema.js";
import { forumCommentMedias } from "@/db/models/forum_comment_media.js";
import { uploadImageToCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import crypto from "crypto";

export const postForumComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { description } = req.body;
    const { id } = req.params;

    if (!userId || !id || !description) {
      throw new ResponseError("Missing required fields", 400);
    }

    const [insertedForumComment] = await db
      .insert(forumComments)
      .values({
        userId: Number(userId),
        forumId: Number(id),
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    let newCommentMedia: any[] = [];
    if (req.files) {
      for (const file of req.files as Express.Multer.File[]) {
        try {
          const uniqueKey = `${
            insertedForumComment.id
          }-${crypto.randomUUID()}-${file.originalname}`;
          const url = await uploadImageToCloudflare(
            uniqueKey,
            file.buffer,
            file.mimetype
          );
          const [media] = await db
            .insert(forumCommentMedias)
            .values({
              forumCommentId: insertedForumComment.id,
              url: url,
              urlForDeletion: uniqueKey,
              mediaType: file.mimetype.startsWith("video") ? "video" : "image",
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          newCommentMedia.push(media);
        } catch (error) {
          console.error("Error uploading file or saving media:", error);
        }
      }
    }

    return res.status(201).json({
      success: true,
      comment: insertedForumComment,
      newCommentMedia,
    });
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
