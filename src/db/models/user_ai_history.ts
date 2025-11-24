import {
  pgTable,
  varchar,
  integer,
  timestamp,
  serial,
  text,
} from "drizzle-orm/pg-core";
import { topics, users } from "../schema.js";
import { aiTabs } from "./ai_tabs.js";

export const userAIHistory = pgTable("user_ai_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  aiResult: text("ai_result"),
  prompt: text("prompt"),
  tabId: integer("tab_id").references(() => aiTabs.id),
  topicId: integer("topic_id").references(() => topics.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
