import { text, pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { topics } from "./topics.js";
import { responseTypeEnum } from "./response_type.js";

export const userAITopicHistory = pgTable("user_ai_topic_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  topicId: integer("topic_id").references(() => topics.id),
  prompt: text("prompt"),
  aiResult: text("ai_result"),
  rating: integer("rating"),
  ratingFeedback: text("rating_feedback"),
  responseType: responseTypeEnum("response_type").default("normal"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
