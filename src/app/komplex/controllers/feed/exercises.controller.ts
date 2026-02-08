import { Request, Response } from "express";
import * as exerciseService from "@/app/komplex/services/feed/exercises/service.js";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";

export const getExercisesController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { grade } = req.query;
    const userId = req.user.userId;
    const result = await exerciseService.getExercises(grade as string, userId);
    return res.status(200).json(result.data);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

export const getExerciseController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const result = await exerciseService.getExercise(id);
    return res.status(200).json(result.data);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
