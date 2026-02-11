import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { notes } from "@/db/models/notes.js";
import { eq } from "drizzle-orm";

export const getMyNotes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.userId;

    const userNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, Number(userId)));

    return res.status(200).json(userNotes);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

