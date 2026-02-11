import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { notes } from "@/db/models/notes.js";

export const createMyNote = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { title, content, topic, tags, isArchived, isPinned, reminderAt } =
      req.body as any;

    const [newNote] = await db
      .insert(notes)
      .values({
        userId: Number(userId),
        title,
        content,
        topic,
        tags,
        isArchived: isArchived ?? false,
        isPinned: isPinned ?? false,
        reminderAt: reminderAt ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return res.status(201).json(newNote);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

