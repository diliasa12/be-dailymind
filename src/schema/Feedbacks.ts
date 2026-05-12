import {
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
const feedbackCategory = pgEnum("category", [
  "pujian",
  "saran fitur",
  "keluhan",
  "lainnya",
]);
export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  category: feedbackCategory("category").notNull(),
  rating: integer("rating").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Feedback = typeof feedbacks.$inferSelect;
export type NewFeedback = typeof feedbacks.$inferInsert;
