import {
  pgTable,
  varchar,
  integer,
  timestamp,
  serial,
  text,
} from "drizzle-orm/pg-core";
import { users } from "../schema.js";
import { responseTypeEnum } from "./response_type.js";

export const userAIHistory = pgTable("user_ai_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  aiResult: text("ai_result"),
  prompt: text("prompt"),
  rating: integer("rating"),
  ratingFeedback: text("rating_feedback"),
  responseType: responseTypeEnum("response_type").default("normal"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
