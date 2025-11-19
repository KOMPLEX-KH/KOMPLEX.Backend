import { Response } from "express";

export const getGeneralAiResponsesController = async (req: Request, res: Response) => {
  try {
    const result = await getAiResponse();
    return res.status(200).json(result);
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
};

export const getTopicAiResponsesController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await getAiTopicResponse();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getGeneralAiDashboardController = async (req: Request, res: Response) => {
  try {
    const result = await getGeneralAiDashboard();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getTopicAiDashboardController = async (req: Request, res: Response) => {
  try {
    const result = await getTopicAiDashboard();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};
