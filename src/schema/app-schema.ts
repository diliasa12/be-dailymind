import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./auth-schema";

export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);

export const moods = pgTable("moods", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  value: integer("value").notNull(),
  label: varchar("label", { length: 50 }).notNull(),
  emotions: jsonb("emotions").default([]).notNull(),
  factors: jsonb("factors").default([]).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pomodoros = pgTable("pomodoros", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  task: varchar("task", { length: 255 }).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  priority: priorityEnum("priority").default("low").notNull(),
  category: varchar("category", { length: 50 }),
  date: date("date").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const Feedbacks = typeof feedbacks.$inferSelect;
export const NewFeedbacks = typeof feedbacks.$inferInsert;
