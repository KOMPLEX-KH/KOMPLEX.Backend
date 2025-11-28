import { Response } from "express";
import { AuthenticatedRequest } from "@/types/request.js";
import * as aiService from "@/app/komplex/services/me/ai/service.js";

export const callAiGeneral = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user.userId;
		const { tabId } = req.params;
		const { prompt, language } = req.body;

		if (!prompt) {
			return res.status(400).json({
				success: false,
				message: "Prompt is required",
			});
		}

		const result = await aiService.callAiGeneralService(prompt, Number(userId), Number(tabId));

		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: (error as Error).message,
		});
	}
};

export const callAiTopic = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user.userId;
		const { prompt, language } = req.body;
		const { topicId } = req.params;
		if (!prompt) {
			return res.status(400).json({
				success: false,
				message: "Prompt is required",
			});
		}
		const result = await aiService.callAiTopicService(prompt, Number(userId), Number(topicId));
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: (error as Error).message,
		});
	}
};

export const callAiFirstTime = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user.userId;
		const { prompt, language } = req.body;

		const result = await aiService.callAiFirstTimeService(String(prompt), Number(userId));
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: (error as Error).message,
		});
	}
};

export const getAllAiTabNames = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user.userId;
		const { page, limit } = req.query;

		const result = await aiService.getAllAiTabNamesService(Number(userId), Number(page), Number(limit));
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: (error as Error).message,
		});
	}
};

export const getAiHistoryBasedOnTab = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user.userId;
		const { tabId } = req.params;
		const { page, limit } = req.query;

		const result = await aiService.getAiHistoryBasedOnTabService(
			Number(userId),
			Number(tabId),
			Number(page),
			Number(limit)
		);
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: (error as Error).message,
		});
	}
};

export const getAiHistoryBasedOnTopic = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user.userId;
		const { topicId } = req.params;
		const { page, limit } = req.query;
		const result = await aiService.getAiHistoryBasedOnTopicService(
			Number(userId),
			Number(topicId),
			Number(page),
			Number(limit)
		);
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: (error as Error).message,
		});
	}
};
