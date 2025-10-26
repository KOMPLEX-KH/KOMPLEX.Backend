import { AuthenticatedRequest } from "../../../types/request.js";
import { Response } from "express";
import * as authService from "../services/auth/service.js";

export const handleLogin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid } = req.body;
    const user = await authService.handleLogin(uid);
    return res.status(200).json(user);
  } catch (error) {
    if ((error as Error).message === "UID is required") {
      return res.status(400).json({ message: "UID is required" });
    }
    if ((error as Error).message === "Invalid credentials") {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    return res.status(500).json({ error: (error as Error).message });
  }
};
