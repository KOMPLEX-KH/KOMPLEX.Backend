import { text, pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const aiTabs = pgTable("ai_tabs", {
	id: serial("id").primaryKey(),
	userId: integer("user_id").references(() => users.id),
	tabName: text("tab_name"),
	tabSummary: text("tab_summary"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});
