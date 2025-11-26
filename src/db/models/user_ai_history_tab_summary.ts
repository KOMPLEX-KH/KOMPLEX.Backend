import { pgTable, integer, timestamp, serial, text } from "drizzle-orm/pg-core";
import { topics, users } from "../schema.js";
import { aiTabs } from "./ai_tabs.js";

export const userAIHistoryTabSummary = pgTable("user_ai_history_tab_summary", {
	id: serial("id").primaryKey(),
	userId: integer("user_id").references(() => users.id),
	summaryText: text("summary_text"),
	tabId: integer("tab_id").references(() => aiTabs.id),
	topicId: integer("topic_id").references(() => topics.id),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});
