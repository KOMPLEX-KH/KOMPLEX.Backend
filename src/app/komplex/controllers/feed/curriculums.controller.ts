import { Request, Response } from "express";
import * as curriculumsService from "@/app/komplex/services/feed/curriculums/service.js";
import * as topicService from "@/app/komplex/services/feed/curriculums/[id]/service.js";
import { AuthenticatedRequest } from "@/types/request.js";
import { getResponseError } from "@/utils/responseError.js";

export const getCurriculums = async (req: Request, res: Response) => {
  try {
    const result = await curriculumsService.getAllCurriculums();
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};

export const getTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {userId} = req.user;
    const result = await topicService.getTopic(id, userId);
    return res.status(200).json(result);
  } catch (error) {
    return getResponseError(res, error as Error);
  }
};
