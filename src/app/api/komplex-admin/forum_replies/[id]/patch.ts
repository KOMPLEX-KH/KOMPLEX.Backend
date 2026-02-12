import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/index.js";
import { forumReplies } from "@/db/schema.js";
import { forumReplyMedias } from "@/db/models/forum_reply_media.js";
import {
  deleteFromCloudflare,
  uploadImageToCloudflare,
} from "@/db/cloudflare/cloudflareFunction.js";
import crypto from "crypto";
import { z } from "@/config/openapi/openapi.js";

export const AdminUpdateForumReplyParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("AdminUpdateForumReplyParams");

export const AdminUpdateForumReplyBodySchema = z
  .object({
    description: z.string(),
    photosToRemove: z.string().optional(),
  })
  .openapi("AdminUpdateForumReplyBody");

export const AdminUpdateForumReplyResponseSchema = z
  .object({
    updateReply: z.any(),
    newReplyMedia: z.array(z.any()),
    deleteMedia: z.any(),
  })
  .openapi("AdminUpdateForumReplyResponse");

export const updateForumReply = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    const { id } = await AdminUpdateForumReplyParamsSchema.parseAsync(
      req.params
    );
    const { description, photosToRemove } =
      await AdminUpdateForumReplyBodySchema.parseAsync(req.body);

    const doesUserOwnThisReply = await db
      .select()
      .from(forumReplies)
      .where(
        and(
          eq(forumReplies.id, Number(id)),
          eq(forumReplies.userId, Number(userId))
        )
      )
      .limit(1);

    if (doesUserOwnThisReply.length === 0) {
      throw new ResponseError("Reply not found", 404);
    }

    let photosToRemoveParse: { url: string }[] = [];
    if (photosToRemove) {
      try {
        photosToRemoveParse = JSON.parse(photosToRemove);
      } catch (err) {
        throw new ResponseError("Invalid photosToRemove format", 400);
      }
    }

    let newReplyMedia: any[] = [];
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
            .insert(forumReplyMedias)
            .values({
              forumReplyId: Number(id),
              url: url,
              urlForDeletion: uniqueKey,
              mediaType: file.mimetype.startsWith("video") ? "video" : "image",
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          newReplyMedia.push(media);
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
              urlForDeletion: forumReplyMedias.urlForDeletion,
            })
            .from(forumReplyMedias)
            .where(eq(forumReplyMedias.url, photoToRemove.url));
          let deleted = null;
          if (urlForDeletion[0]?.urlForDeletion) {
            await deleteFromCloudflare(
              "komplex-image",
              urlForDeletion[0].urlForDeletion
            );
            deleted = await db
              .delete(forumReplyMedias)
              .where(
                and(
                  eq(forumReplyMedias.forumReplyId, Number(id)),
                  eq(
                    forumReplyMedias.urlForDeletion,
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

    const [updateReply] = await db
      .update(forumReplies)
      .set({
        description,
        updatedAt: new Date(),
      })
      .where(eq(forumReplies.id, Number(id)))
      .returning();

    const responseBody = AdminUpdateForumReplyResponseSchema.parse({
      updateReply,
      newReplyMedia,
      deleteMedia,
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
