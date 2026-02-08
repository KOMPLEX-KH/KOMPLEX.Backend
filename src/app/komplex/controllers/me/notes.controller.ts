import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import * as noteService from "@/app/komplex/services/me/notes/service.js";
import * as noteByIdService from "@/app/komplex/services/me/notes/[id]/service.js";
import { getResponseError ,ResponseError} from "@/utils/responseError.js";


export const getAllMyNotesController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const notes = await noteService.getAllNotes();

    const userNotes = notes.filter(note => note.userId === userId);
    res.status(200).json(userNotes);
  } catch (error) {
    return getResponseError(res, error );
  }
};


export const createMyNotesController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const body = req.body;

    const newNote = await noteService.createNotes(body, Number(userId));

    return res.status(201).json(newNote);
  } catch (error) {
    return getResponseError(res, error );
  }
};


export const updateMyNoteController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const noteId = req.params.id;
    const body = req.body;

    const success = await noteByIdService.updateNotes(noteId, body, userId);
    if (!success) {
      return getResponseError(res, new ResponseError("Note not found or not authorized", 404));
    } else {
      return res.status(200).json({ message: "Note updated successfully" });
    }
  } catch (error) {
    return getResponseError(res, error );
  }
};

export const getMyNoteByIdController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const noteId = req.params.id;

    const note = await noteService.getNotesById(noteId, userId);
    if (note) {
      return res.status(200).json(note);
    } else {
      return getResponseError(res, new ResponseError("Note not found or not authorized", 404));
    }

  } catch (error) {
    
    getResponseError(res, error );
  }
};

export const DeleteMyNoteController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const noteId = req.params.id;

    const success = await noteByIdService.deleteNotes(noteId, userId);
    if (success) {
      return res.status(200).json({ message: "Note deleted successfully" });
    } else {
      return getResponseError(res, new ResponseError("Note not found or not authorized", 404));
    }
  } catch (error) {
    return getResponseError(res, error );
  }
};