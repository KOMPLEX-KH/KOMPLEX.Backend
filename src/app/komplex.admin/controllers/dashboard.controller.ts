import { Request, Response } from "express";
import * as dashboardService from "../services/dashboard/service.js";

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const dashboardData = await dashboardService.getDashboardData();
    return res.status(200).json(dashboardData);
  } catch (error: any) {
    console.error("Dashboard error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};
