import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/response.js";
import { db } from "@/db/drizzle/index.js";
import { forumComments } from "@/db/drizzle/schema.js";
import { forumCommentMedias } from "@/db/drizzle/models/forum_comment_media.js";
import { uploadImageToCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import crypto from "crypto";
import { z } from "@/config/openapi/openapi.js";

export const PostForumCommentParamsSchema = z.object({
  id: z.string(),
}).openapi("PostForumCommentParams");

export const PostForumCommentBodySchema = z.object({
  description: z.string(),
}).openapi("PostForumCommentBody");

export const PostForumCommentResponseSchema = z.object({
  comment: z.object({
    id: z.number(),
    userId: z.number(),
    forumId: z.number(),
    description: z.string(),
  }),
  newCommentMedia: z.array(z.object({
    id: z.number(),
    url: z.string(),
    urlForDeletion: z.string(),
    mediaType: z.string(),
  })),
}).openapi("PostForumCommentResponseSchema");
export const postForumComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { description } = await PostForumCommentBodySchema.parseAsync(req.body);
    const { id } = await PostForumCommentParamsSchema.parseAsync(req.params);

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
          const uniqueKey = `${insertedForumComment.id
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

    return res.status(201).json(PostForumCommentResponseSchema.parse({
      success: true,
      comment: {
        id: insertedForumComment.id,
        userId: insertedForumComment.userId,
        forumId: insertedForumComment.forumId,
        description: insertedForumComment.description,
      },
      newCommentMedia,
    }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
