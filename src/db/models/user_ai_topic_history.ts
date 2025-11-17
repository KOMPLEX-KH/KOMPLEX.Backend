import { text, pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { topics } from "./topics.js";

export const userAiTopicHistories = pgTable("user_ai_topic_histories", {
	id: serial("id").primaryKey(),
	userId: integer("user_id").references(() => users.id),
	topicId: integer("topic_id").references(() => topics.id),
	prompt: text("prompt"),
	aiResult: text("ai_result"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});