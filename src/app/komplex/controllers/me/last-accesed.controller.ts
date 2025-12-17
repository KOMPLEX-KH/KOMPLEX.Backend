import { db } from "@/db/index.js";
import { users } from "@/db/schema.js";
import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";
import { getLastAccessedService } from "../../services/me/last-accessed/service.js";

export const getLastAccessed = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.user;
    if (!userId || userId === 0) {
      return res.status(200).json({ data: [] });
    }
    const lastAccessed = await getLastAccessedService(userId);
    return res.status(200).json(lastAccessed);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
};
