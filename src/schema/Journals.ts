import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./auth-schema";
export const journals = pgTable("journals", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  moodEmoji: varchar("mood_emoji", { length: 10 }),
  tags: jsonb("tags").default([]).notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Journal = typeof journals.$inferSelect;
export type NewJournal = typeof journals.$inferInsert;
