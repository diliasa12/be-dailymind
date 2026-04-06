import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth-schema";

export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Feedback = typeof feedbacks.$inferSelect;
export type NewFeedback = typeof feedbacks.$inferInsert;
