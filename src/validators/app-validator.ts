import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { moods, pomodoros, journals, todos, feedbacks } from "@/schema";

// ─── Moods ────────────────────────────────────────────────────────────────────

export const insertMoodSchema = createInsertSchema(moods)
  .omit({ id: true, userId: true, createdAt: true })
  .meta({ id: "InsertMood" });

export const selectMoodSchema = createSelectSchema(moods).meta({ id: "Mood" });

// ─── Pomodoros ────────────────────────────────────────────────────────────────

export const insertPomodoroSchema = createInsertSchema(pomodoros)
  .omit({ id: true, userId: true, createdAt: true })
  .meta({ id: "InsertPomodoro" });

export const selectPomodoroSchema = createSelectSchema(pomodoros).meta({
  id: "Pomodoro",
});

// ─── Journals ─────────────────────────────────────────────────────────────────

export const insertJournalSchema = createInsertSchema(journals)
  .omit({ id: true, userId: true, createdAt: true })
  .meta({ id: "InsertJournal" });

export const updateJournalSchema = createInsertSchema(journals)
  .omit({ id: true, userId: true, createdAt: true })
  .partial()
  .meta({ id: "UpdateJournal" });

export const selectJournalSchema = createSelectSchema(journals).meta({
  id: "Journal",
});

// ─── Todos ────────────────────────────────────────────────────────────────────

export const insertTodoSchema = createInsertSchema(todos)
  .omit({ id: true, userId: true, createdAt: true, completedAt: true })
  .meta({ id: "InsertTodo" });

export const updateTodoSchema = createInsertSchema(todos)
  .omit({ id: true, userId: true, createdAt: true })
  .partial()
  .meta({ id: "UpdateTodo" });

export const selectTodoSchema = createSelectSchema(todos).meta({ id: "Todo" });

// ─── Feedbacks ────────────────────────────────────────────────────────────────

export const insertFeedbackSchema = createInsertSchema(feedbacks)
  .omit({ id: true, userId: true, createdAt: true })
  .meta({ id: "InsertFeedback" });

export const updateFeedbackSchema = insertFeedbackSchema
  .partial()
  .meta({ id: "UpdateFeedback" });

export const selectFeedbackSchema = createSelectSchema(feedbacks).meta({
  id: "Feedback",
});
