import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./auth-schema";

export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);

export const Todos = pgTable("todos", {
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
export type Todos = typeof Todos.$inferSelect;
export type NewTodos = typeof Todos.$inferInsert;
