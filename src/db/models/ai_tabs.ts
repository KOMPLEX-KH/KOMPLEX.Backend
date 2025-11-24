import { text, pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { userAIHistory } from "./user_ai_history.js";

export const aiTabs = pgTable("ai_tabs", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    tabName: text("tab_name"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
