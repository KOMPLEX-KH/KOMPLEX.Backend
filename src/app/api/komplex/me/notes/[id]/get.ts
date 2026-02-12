import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { db } from "@/db/index.js";
import { notes } from "@/db/models/notes.js";
import { and, eq } from "drizzle-orm";

export const getMyNoteById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const result = await db
      .select()
      .from(notes)
      .where(
        and(eq(notes.id, Number(id)), eq(notes.userId, Number(userId)))
      )
      .limit(1);

    if (!result.length) {
      return getResponseError(
        res,
        new ResponseError("Note not found or not authorized", 404)
      );
    }

    return res.status(200).json(result[0]);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

