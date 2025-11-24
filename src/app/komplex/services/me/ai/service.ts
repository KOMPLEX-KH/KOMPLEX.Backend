import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { userAIHistory } from "@/db/schema.js";
import { eq, desc, asc, and } from "drizzle-orm";
import axios from "axios";
import { aiTabs } from "@/db/models/ai_tabs.js";
import { InferenceClient } from "@huggingface/inference";

export const callAiAndWriteToHistory = async (
	prompt: string,
	language: string,
	userId: number,
	tabId: number,
	firstTime: boolean
) => {
	try {
		if (firstTime) {
			await createNewTab(userId, prompt);
		}
		const cacheKey = `previousContext:${userId}:tabId:${tabId}`;
		const cacheRaw = await redis.get(cacheKey);
		const cacheData = cacheRaw ? JSON.parse(cacheRaw) : null;
		let previousContext = null;
		if (Array.isArray(cacheData) && cacheData.length >= 5) {
			previousContext = cacheData;
		} else {
			previousContext = await db
				.select({
					prompt: userAIHistory.prompt,
					aiResult: userAIHistory.aiResult,
					tabName: aiTabs.tabName,
				})
				.from(userAIHistory)
				.innerJoin(aiTabs, eq(userAIHistory.tabId, aiTabs.id))
				.where(and(eq(userAIHistory.userId, Number(userId)), eq(userAIHistory.tabId, tabId)))
				.orderBy(desc(userAIHistory.createdAt))
				.limit(5)
				.then((res) => res.map((r) => r.prompt).join("\n"));
		}
		const response = await axios.post(
			`${process.env.FAST_API_KEY}`,
			{
				input: prompt,
				language,
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
			const newHistory = await db
				.insert(userAIHistory)
				.values({
					userId: Number(userId),
					prompt: prompt,
					aiResult: aiResult,
					tabId: tabId,
				})
				.returning();

			if (cacheData) {
				const updatedCache = [...cacheData, { prompt, aiResult }];
				await redis.set(cacheKey, JSON.stringify(updatedCache), { EX: 60 * 60 * 24 });
			} else {
				const newCacheData = await db
					.select({
						prompt: userAIHistory.prompt,
						aiResult: userAIHistory.aiResult,
					})
					.from(userAIHistory)
					.where(eq(userAIHistory.userId, Number(userId)))
					.orderBy(desc(userAIHistory.createdAt))
					.limit(4)
					.then((res) => res.map((r) => r.prompt).join("\n"));
				await redis.set(cacheKey, JSON.stringify([...newCacheData, ...newHistory]), { EX: 60 * 60 * 24 });
			}
		}
		return { prompt, data: aiResult };
	} catch (error) {
		throw new Error((error as Error).message);
	}
};

export const getAllAiTabNames = async (userId: number, page?: number, limit?: number) => {
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

export const getAiHistoryBasedOnTab = async (userId: number, tabId: number) => {
	try {
		const cacheKey = `aiHistory:${userId}:tabId:${tabId}`;
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

const createNewTab = async (userId: number, tabName: string) => {
	try {
		let tabNameTrimmed = tabName.slice(0, 100);
		if (!detectNoneEnglish(tabNameTrimmed)) {
			const hgKey=process.env.HUGGING_FACE_SECRET_KEY!;
			const client = new InferenceClient(hgKey);

			const output = await client.summarization({
				model: "facebook/bart-large-cnn",
				inputs: tabNameTrimmed,
				provider: "hf-inference",
			});
			if (output && Array.isArray(output) && output.length > 0 && output[0].summary_text) {
				tabNameTrimmed = output[0].summary_text;
			}
		}
		const newTab = await db
			.insert(aiTabs)
			.values({
				userId: Number(userId),
				tabName: tabName,
			})
			.returning();
		const cacheKey = `aiTabs:${userId}:page:1`;
		const cached= await redis.get(cacheKey);
		const parseData = cached ? JSON.parse(cached) : null;
		if (parseData) {
			const updatedCache = [newTab[0], ...parseData];
			await redis.set(cacheKey, JSON.stringify(updatedCache), { EX: 60 * 60 * 24 });
		}
		return newTab;
	} catch (error) {
		throw new Error((error as Error).message);
	}
};

const detectNoneEnglish = (text: string) => {
	const nonEnglishRegex = /[^\x00-\x7F]/;
	return nonEnglishRegex.test(text);
};
//   offset?: number
// ) => {
//   try {
//     const cacheKey = `aiHistory:${userId}:page:${page ?? 1}`;
//     await redis.del(cacheKey);
//     const cached = await redis.get(cacheKey);
//     const parseData = cached ? JSON.parse(cached) : null;
//     if (parseData) {
//       return {
//         data: parseData.slice((limit ?? 20) - parseData.length),
//         hasMore: parseData.length === (limit ?? 20),
//       };
//     }
//     const history = await db
//       .select()
//       .from(userAIHistory)
//       .where(eq(userAIHistory.userId, Number(userId)))
//       .orderBy(desc(userAIHistory.createdAt))
//       .limit(limit ?? 20)
//       .offset(((page ?? 1) - 1) * (limit ?? 20));
//     const reversedHistory = history.reverse();
//     await redis.set(cacheKey, JSON.stringify(reversedHistory), {
//       EX: 60 * 60 * 24,
//     });
//     return {
//       data: reversedHistory,
//       hasMore: history.length === (limit ?? 20),
//     };
//   } catch (error) {
//     throw new Error((error as Error).message);
//   }
// };
