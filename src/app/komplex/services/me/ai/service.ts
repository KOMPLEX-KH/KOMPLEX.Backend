import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { topics, userAIHistory } from "@/db/schema.js";
import { eq, desc, asc, and } from "drizzle-orm";
import axios from "axios";
import { aiTabs } from "@/db/models/ai_tabs.js";
import { InferenceClient } from "@huggingface/inference";
import { userAIHistoryTabSummary } from "@/db/models/user_ai_history_tab_summary.js";

export const callAiGeneralService = async (prompt: string, userId: number, tabId: number) => {
	try {
		const cacheKey = `previousContext:${userId}:tabId:${tabId}`;
		const cacheRaw = await redis.get(cacheKey);
		const cacheData = cacheRaw ? JSON.parse(cacheRaw) : null;
		let previousContext = null;
		if (Array.isArray(cacheData) && cacheData.length >= 5) {
			previousContext = cacheData;
		} else {
			previousContext = await db
				.select({
					summaryText: userAIHistoryTabSummary.summaryText,
				})
				.from(userAIHistoryTabSummary)
				.where(
					and(eq(userAIHistoryTabSummary.userId, Number(userId)), eq(userAIHistoryTabSummary.tabId, tabId))
				);
			await redis.set(cacheKey, JSON.stringify(previousContext), { EX: 60 * 60 * 24 });
		}
		const response = await axios.post(
			`${process.env.FAST_API_KEY}`,
			{
				input: prompt,
				previousContext,
			},
			{
				headers: {
					"Content-Type": "application/json",
					"x-api-key": process.env.INTERNAL_API_KEY,
				},
			}
		);
		const result = response.data;
		const aiResult = result.result;
		if (aiResult) {
			await db.insert(userAIHistory).values({
				userId: Number(userId),
				prompt: prompt,
				aiResult: aiResult,
				tabId: tabId,
				topicId: null,
			});
			const summarizeCounterCacheKey = `summarizeCounter:${userId}:tabId:${tabId}`;
			const currentCountRaw = await redis.get(summarizeCounterCacheKey);
			const currentCount = currentCountRaw ? parseInt(currentCountRaw, 10) : 0;
			if (currentCount >= 5) {
				const summaryText = await summarize(aiResult);
				await db
					.update(userAIHistoryTabSummary)
					.set({
						userId: Number(userId),
						summaryText: summaryText.summary || aiResult,
						tabId: tabId,
					})
					.returning();
				await redis.set(summarizeCounterCacheKey, "0", { EX: 60 * 60 * 24 * 3 });
			} else {
				await redis.set(summarizeCounterCacheKey, (currentCount + 1).toString(), { EX: 60 * 60 * 24 * 3 });
			}
		}
		return { prompt, data: aiResult };
	} catch (error) {
		throw new Error((error as Error).message);
	}
};

export const callAiTopicService = async (prompt: string, userId: number, topicId: number) => {
	try {
		const cacheKey = `previousContext:${userId}:topicId:${topicId}`;
		const cacheRaw = await redis.get(cacheKey);
		const cacheData = cacheRaw ? JSON.parse(cacheRaw) : null;
		let previousContext = null;

		if (Array.isArray(cacheData) && cacheData.length >= 5) {
			previousContext = cacheData;
		} else {
			previousContext = await db
				.select({ summaryText: userAIHistoryTabSummary.summaryText })
				.from(userAIHistoryTabSummary)
				.where(
					and(
						eq(userAIHistoryTabSummary.userId, Number(userId)),
						eq(userAIHistoryTabSummary.topicId, topicId)
					)
				);
			await redis.set(cacheKey, JSON.stringify(previousContext), { EX: 60 * 60 * 24 });
		}

		const response = await axios.post(
			`${process.env.FAST_API_KEY}`,
			{
				input: prompt,
				previousContext,
			},
			{
				headers: {
					"Content-Type": "application/json",
					"x-api-key": process.env.INTERNAL_API_KEY,
				},
			}
		);

		const result = response.data;
		const aiResult = result.result;

		if (aiResult) {
			await db.insert(userAIHistory).values({
				userId: Number(userId),
				prompt,
				aiResult,
				tabId: null,
				topicId,
			});
			const summarizeCounterCacheKey = `summarizeCounter:${userId}:topicId:${topicId}`;
			const currentCountRaw = await redis.get(summarizeCounterCacheKey);
			const currentCount = currentCountRaw ? parseInt(currentCountRaw, 10) : 0;
			if (currentCount >= 5) {
				const summaryText = await summarize(aiResult);
				await db
					.update(userAIHistoryTabSummary)
					.set({
						userId: Number(userId),
						summaryText: summaryText.summary || aiResult,
						tabId: null,
						topicId,
					})
					.returning();
				await redis.set(summarizeCounterCacheKey, "0", { EX: 60 * 60 * 24 * 3 });
			} else {
				await redis.set(summarizeCounterCacheKey, (currentCount + 1).toString(), { EX: 60 * 60 * 24 * 3 });
			}
		}

		return { prompt, data: aiResult };
	} catch (error) {
		throw new Error((error as Error).message);
	}
};

export const callAiFirstTimeService = async (prompt: string, userId: number) => {
	try {
		const tabIdAndTabName = await createNewTab(userId, prompt);
		console.log("Created new tab:", tabIdAndTabName);
		const response = await axios.post(
			`${process.env.FAST_API_KEY}`,
			{
				input: prompt,
				previousContext: "",
			},
			{
				headers: {
					"Content-Type": "application/json",
					"x-api-key": process.env.INTERNAL_API_KEY,
				},
			}
		);
		const result = response.data;
		const aiResult = result.result;
		if (aiResult) {
			await db.insert(userAIHistory).values({
				userId: Number(userId),
				prompt: prompt,
				aiResult: aiResult,
				tabId: tabIdAndTabName.tabId,
				topicId: null,
			});
			await db.insert(userAIHistoryTabSummary).values({
				userId: Number(userId),
				summaryText: tabIdAndTabName.tabName || aiResult,
				tabId: tabIdAndTabName.tabId,
			});
			const cacheKey = `previousContext:${userId}:tabId:${tabIdAndTabName.tabId}`;
			await redis.set(cacheKey, JSON.stringify(aiResult), { EX: 60 * 60 * 24 });
			const summarizeCounterCacheKey = `summarizeCounter:${userId}:tabId:${tabIdAndTabName.tabId}`;
			await redis.set(summarizeCounterCacheKey, "0", { EX: 60 * 60 * 24 * 3 });
		}
		return { prompt, data: aiResult };
	} catch (error) {
		throw new Error((error as Error).message);
	}
};

export const getAllAiTabNamesService = async (userId: number, page?: number, limit?: number) => {
	try {
		const cacheKey = `aiTabs:${userId}:page:${page ?? 1}`;
		const cached = await redis.get(cacheKey);
		const parseData = cached ? JSON.parse(cached) : null;
		if (parseData) {
			return {
				data: parseData,
			};
		}
		const tabs = await db
			.select({ id: aiTabs.id, tabName: aiTabs.tabName })
			.from(aiTabs)
			.where(eq(aiTabs.userId, Number(userId)))
			.orderBy(asc(aiTabs.updatedAt))
			.limit(limit ?? 20)
			.offset(((page ?? 1) - 1) * (limit ?? 20));
		await redis.set(cacheKey, JSON.stringify(tabs), {
			EX: 60 * 60 * 24,
		});
		return {
			data: tabs,
			hasMore: tabs.length === (limit ?? 20),
		};
	} catch (error) {
		throw new Error((error as Error).message);
	}
};

export const getAiHistoryBasedOnTabService = async (userId: number, tabId: number, page?: number, limit?: number) => {
	try {
		const cacheKey = `aiHistory:${userId}:tabId:${tabId}:page:${page ?? 1}`;
		const cached = await redis.get(cacheKey);
		const parseData = cached ? JSON.parse(cached) : null;
		if (parseData) {
			return {
				data: parseData,
			};
		}
		const history = await db
			.select({ prompt: userAIHistory.prompt, aiResult: userAIHistory.aiResult })
			.from(userAIHistory)
			.limit(limit ?? 20)
			.offset(((page ?? 1) - 1) * (limit ?? 20))
			.where(and(eq(userAIHistory.tabId, tabId), eq(userAIHistory.userId, userId)))
			.orderBy(desc(userAIHistory.updatedAt));
		await redis.set(cacheKey, JSON.stringify(history), {
			EX: 60 * 60 * 24,
		});
		return {
			data: history,
		};
	} catch (error) {
		throw new Error((error as Error).message);
	}
};

export const getAiHistoryBasedOnTopicService = async (
	userId: number,
	topicId: number,
	page?: number,
	limit?: number
) => {
	try {
		const cacheKey = `aiHistory:${userId}:topicId:${topicId}:page:${page ?? 1}`;
		const cached = await redis.get(cacheKey);
		const parseData = cached ? JSON.parse(cached) : null;
		if (parseData) {
			return {
				data: parseData,
			};
		}
		const history = await db
			.select({ prompt: userAIHistory.prompt, aiResult: userAIHistory.aiResult })
			.from(userAIHistory)
			.limit(limit ?? 20)
			.offset(((page ?? 1) - 1) * (limit ?? 20))
			.where(and(eq(userAIHistory.topicId, topicId), eq(userAIHistory.userId, userId)))
			.orderBy(desc(userAIHistory.updatedAt));
		await redis.set(cacheKey, JSON.stringify(history), {
			EX: 60 * 60 * 24,
		});
		return {
			data: history,
		};
	} catch (error) {
		throw new Error((error as Error).message);
	}
};

const createNewTab = async (userId: number, tabName: string) => {
	try {
		const summarizedTabName = await summarize(tabName);
		const [newTab] = await db
			.insert(aiTabs)
			.values({
				userId: Number(userId),
				tabName: summarizedTabName.summary || summarizedTabName,
			})
			.returning({ id: aiTabs.id });
		const cacheKey = `aiTabs:${userId}:page:1`;
		const cached = await redis.get(cacheKey);
		const parseData = cached ? JSON.parse(cached) : null;
		if (parseData) {
			const updatedCache = [newTab, ...parseData];
			await redis.set(cacheKey, JSON.stringify(updatedCache), { EX: 60 * 60 * 24 });
		}
		return { tabId: newTab.id, tabName: summarizedTabName.summary || summarizedTabName };
	} catch (error) {
		throw new Error((error as Error).message);
	}
};

const summarize = async (text: string) => {
	if ([...text].length < 50) {
		return { summary: text };
	}
	const response = await axios.post(
		`${process.env.SUMMARY_API_URL}`,
		{
			text: text,
		},
		{
			headers: {
				"Content-Type": "application/json",
				"x-api-key": process.env.INTERNAL_API_KEY,
			},
		}
	);
	return response.data;
};
