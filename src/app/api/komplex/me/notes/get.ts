import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { notes } from "@/db/models/notes.js";
import { eq } from "drizzle-orm";
import { z } from "@/config/openapi/openapi.js";

export const NoteItemSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  content: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  tags: z.any().nullable().optional(),
  isArchived: z.boolean(),
  isPinned: z.boolean(),
  reminderAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const MeNotesResponseSchema = z
  .object({
    data: z.array(NoteItemSchema),
  })
  .openapi("MeNotesResponse");

export const getMyNotes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.userId;

    const userNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, Number(userId)));

    const responseBody = MeNotesResponseSchema.parse({ data: userNotes });

    return res.status(200).json(responseBody);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

