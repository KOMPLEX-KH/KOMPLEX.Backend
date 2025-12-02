import { pgTable, integer, timestamp, serial, text } from "drizzle-orm/pg-core";
import { users } from "../schema.js";
import { userAiTabs } from "./user_ai_tabs.js";
import { responseTypeEnum } from "./response_type.js";

export const userAIHistory = pgTable("user_ai_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  aiResult: text("ai_result"),
  prompt: text("prompt"),
  tabId: integer("tab_id").references(() => userAiTabs.id),
  rating: integer("rating"),
  ratingFeedback: text("rating_feedback"),
  responseType: responseTypeEnum("response_type").default("normal"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
