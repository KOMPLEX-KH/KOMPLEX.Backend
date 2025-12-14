import {
  pgTable,
  integer,
  text,
  date,
  boolean,
  timestamp,
  serial,
} from "drizzle-orm/pg-core";
import { topics } from "./topics.js";
import { videos } from "./videos.js";
import { userAiTabs } from "./user_ai_tabs.js";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").unique(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  dateOfBirth: date("date_of_birth"),
  isAdmin: boolean("is_admin"),
  isVerified: boolean("is_verified"),
  isSocial: boolean("is_social"),
  email: text("email"),
  phone: text("phone"),
  profileImage: text("profile_image"),
  profileImageKey: text("profile_image_key"),
  lastTopicId: integer("last_topic_id").references(() => topics.id),
  lastVideoId: integer("last_video_id").references(() => videos.id),
  lastAiTabId: integer("last_ai_tab_id").references(() => userAiTabs.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
