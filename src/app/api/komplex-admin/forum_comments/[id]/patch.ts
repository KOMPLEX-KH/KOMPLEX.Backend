import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/index.js";
import { forumComments } from "@/db/schema.js";
import { forumCommentMedias } from "@/db/models/forum_comment_media.js";
import {
  deleteFromCloudflare,
  uploadImageToCloudflare,
} from "@/db/cloudflare/cloudflareFunction.js";
import crypto from "crypto";
import { z } from "@/config/openapi/openapi.js";

export const UpdateForumCommentParamsSchema = z.object({
  id: z.string(),
}).openapi("UpdateForumCommentParams");

export const UpdateForumCommentBodySchema = z.object({
  description: z.string(),
  photosToRemove: z.string().optional(),
}).openapi("UpdateForumCommentBody");

export const UpdateForumCommentResponseSchema = z.object({
  updateComment: z.object({
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
  deleteMedia: z.array(z.object({
    id: z.number(),
  })),
}).openapi("UpdateForumCommentResponseSchema");

export const updateForumComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { id } = await UpdateForumCommentParamsSchema.parseAsync(req.params);
    const { description, photosToRemove } = await UpdateForumCommentBodySchema.parseAsync(req.body);

    const doesUserOwnThisComment = await db
      .select()
      .from(forumComments)
      .where(and(eq(forumComments.id, Number(id)), eq(forumComments.userId, Number(userId))))
      .limit(1);

    if (doesUserOwnThisComment.length === 0) {
      throw new ResponseError("Comment not found", 404);
    }

    let photosToRemoveParse: { url: string }[] = [];
    if (photosToRemove) {
      try {
        photosToRemoveParse = JSON.parse(photosToRemove);
      } catch (err) {
        throw new ResponseError("Invalid photosToRemove format", 400);
      }
    }

    let newCommentMedia: any[] = [];
    if (req.files) {
      for (const file of req.files as Express.Multer.File[]) {
        try {
          const uniqueKey = `${id}-${crypto.randomUUID()}-${file.originalname}`;
          const url = await uploadImageToCloudflare(
            uniqueKey,
            file.buffer,
            file.mimetype
          );
          const [media] = await db
            .insert(forumCommentMedias)
            .values({
              forumCommentId: Number(id),
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

    let deleteMedia = null;
    if (photosToRemoveParse && photosToRemoveParse.length > 0) {
      const deleteResults = await Promise.all(
        photosToRemoveParse.map(async (photoToRemove: any) => {
          const urlForDeletion = await db
            .select({
              urlForDeletion: forumCommentMedias.urlForDeletion,
            })
            .from(forumCommentMedias)
            .where(eq(forumCommentMedias.url, photoToRemove.url));
          let deleted = null;
          if (urlForDeletion[0]?.urlForDeletion) {
            await deleteFromCloudflare(
              "komplex-image",
              urlForDeletion[0].urlForDeletion
            );
            deleted = await db
              .delete(forumCommentMedias)
              .where(
                and(
                  eq(forumCommentMedias.forumCommentId, Number(id)),
                  eq(
                    forumCommentMedias.urlForDeletion,
                    urlForDeletion[0].urlForDeletion
                  )
                )
              )
              .returning();
          }
          return deleted;
        })
      );

      deleteMedia = deleteResults.flat();
    }

    const [updateComment] = await db
      .update(forumComments)
      .set({
        description,
        updatedAt: new Date(),
      })
      .where(eq(forumComments.id, Number(id)))
      .returning();

    return res.status(200).json(UpdateForumCommentResponseSchema.parse({
      updateComment: {
        id: updateComment.id,
        userId: updateComment.userId,
        forumId: updateComment.forumId,
        description: updateComment.description,
      },
      newCommentMedia,
      deleteMedia,
    }));
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
