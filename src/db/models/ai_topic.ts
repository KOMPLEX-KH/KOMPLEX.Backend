import { text, pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { subjects } from "./subjects.js";
import { users } from "./users.js";
import { topics } from "./topics.js";

export const aiTopics = pgTable("ai_topic", {
	id: serial("id").primaryKey(),
	userId: integer("user_id").references(() => users.id),
	topicId: integer("topic_id").references(() => topics.id),
	aiResult: text("ai_result"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});
