import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  moods,
  pomodoros,
  journals,
  todos,
  feedbacks,
  bannedWords,
} from "@/schema";
import * as z from "zod";

// ─── Moods ────────────────────────────────────────────────────────────────────

// ─── Moods ────────────────────────────────────────────────────────────────────

// ─── Pomodoros ────────────────────────────────────────────────────────────────

export const insertPomodoroSchema = createInsertSchema(pomodoros).omit({
  id: true,
  userId: true,
  createdAt: true,
});
export const selectPomodoroSchema = createSelectSchema(pomodoros);

// ─── Journals ─────────────────────────────────────────────────────────────────

export const insertJournalSchema = createInsertSchema(journals).omit({
  id: true,
  userId: true,
  createdAt: true,
});
export const updateJournalSchema = createInsertSchema(journals)
  .omit({ id: true, userId: true, createdAt: true })
  .partial();
export const selectJournalSchema = createSelectSchema(journals);

// ─── Todos ────────────────────────────────────────────────────────────────────

export const insertTodoSchema = createInsertSchema(todos).omit({
  id: true,
  userId: true,
  createdAt: true,
  completedAt: true,
});
export const updateTodoSchema = createInsertSchema(todos)
  .omit({ id: true, userId: true, createdAt: true })
  .partial();
export const selectTodoSchema = createSelectSchema(todos);

// ─── Feedbacks ────────────────────────────────────────────────────────────────

export const insertFeedbackSchema = createInsertSchema(feedbacks).omit({
  id: true,
  userId: true,
  createdAt: true,
  status: true, // status di-set otomatis "unread" saat user kirim feedback
});
export const updateFeedbackSchema = insertFeedbackSchema.partial();
export const selectFeedbackSchema = createSelectSchema(feedbacks);

// Admin: hanya bisa update status feedback
export const updateFeedbackStatusSchema = createInsertSchema(feedbacks).pick({
  status: true,
});

// ─── Banned Words ─────────────────────────────────────────────────────────────

export const insertBannedWordSchema = createInsertSchema(bannedWords)
  .pick({
    word: true,
  })
  .extend({
    word: z
      .string()
      .min(1)
      .transform((v) => v.trim()),
  });
export const selectBannedWordSchema = createSelectSchema(bannedWords);
