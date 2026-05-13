import { Hono } from "hono";
import { describeRoute, validator as zValidator, resolver } from "hono-openapi";
import { eq, and } from "drizzle-orm";
import z from "zod";
import { db } from "../db/db";
import { feedbacks } from "../schema/Feedbacks";
import {
  insertFeedbackSchema,
  updateFeedbackSchema,
} from "../validators/app-validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppVariables } from "@/types/type";

const feedbackApp = new Hono<{ Variables: AppVariables }>();

feedbackApp.use("*", authMiddleware);

// ─── Schemas ──────────────────────────────────────────────────────────────────

const FeedbackSchema = z
  .object({
    id: z.number(),
    message: z.string(),
    rating: z.number().min(1).max(5),
    category: z.string(),
    userId: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .meta({ ref: "Feedback" });

const ErrorSchema = z
  .object({ error: z.string() })
  .meta({ ref: "FeedbackError" });

const ParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
});

// ─── POST / ───────────────────────────────────────────────────────────────────

feedbackApp.post(
  "/",
  describeRoute({
    tags: ["Feedbacks"],
    summary: "Kirim feedback",
    description: "Menyimpan feedback baru dari user yang sedang login.",
    security: [{ bearerAuth: [] }],
    responses: {
      201: {
        description: "Feedback berhasil dikirim",
        content: {
          "application/json": {
            schema: resolver(z.object({ data: FeedbackSchema })),
          },
        },
      },
      400: {
        description: "Validasi gagal",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
    },
  }),
  zValidator("json", insertFeedbackSchema),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");

    const newFeedback = await db
      .insert(feedbacks)
      .values({
        message: body.message,
        rating: body.rating,
        category: body.category,
        userId: user!.id,
      })
      .returning();

    return c.json({ data: newFeedback[0] }, 201);
  },
);

// ─── GET / ────────────────────────────────────────────────────────────────────

feedbackApp.get(
  "/",
  describeRoute({
    tags: ["Feedbacks"],
    summary: "Daftar semua feedback",
    description: "Mengambil semua feedback milik user yang sedang login.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Daftar feedback",
        content: {
          "application/json": {
            schema: resolver(z.object({ data: z.array(FeedbackSchema) })),
          },
        },
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
    },
  }),
  async (c) => {
    const user = c.get("user");

    const data = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.userId, user!.id));

    return c.json({ data });
  },
);

// ─── GET /:id ─────────────────────────────────────────────────────────────────

feedbackApp.get(
  "/:id",
  describeRoute({
    tags: ["Feedbacks"],
    summary: "Detail feedback",
    description: "Mengambil satu feedback berdasarkan ID.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Feedback ditemukan",
        content: {
          "application/json": {
            schema: resolver(z.object({ data: FeedbackSchema })),
          },
        },
      },
      404: {
        description: "Feedback tidak ditemukan",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
    },
  }),
  zValidator("param", ParamSchema),
  async (c) => {
    const user = c.get("user");
    const id = Number(c.req.valid("param").id);

    const data = await db
      .select()
      .from(feedbacks)
      .where(and(eq(feedbacks.id, id), eq(feedbacks.userId, user!.id)));

    if (data.length === 0) {
      return c.json({ error: "Feedback tidak ditemukan" }, 404);
    }

    return c.json({ data: data[0] });
  },
);

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

feedbackApp.delete(
  "/:id",
  describeRoute({
    tags: ["Feedbacks"],
    summary: "Hapus feedback",
    description: "Menghapus feedback berdasarkan ID.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Feedback berhasil dihapus",
        content: {
          "application/json": {
            schema: resolver(z.object({ data: FeedbackSchema })),
          },
        },
      },
      404: {
        description: "Feedback tidak ditemukan",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
    },
  }),
  zValidator("param", ParamSchema),
  async (c) => {
    const user = c.get("user");
    const id = Number(c.req.valid("param").id);

    const deletedFeedback = await db
      .delete(feedbacks)
      .where(and(eq(feedbacks.id, id), eq(feedbacks.userId, user!.id)))
      .returning();

    if (deletedFeedback.length === 0) {
      return c.json({ error: "Feedback tidak ditemukan" }, 404);
    }

    return c.json({ data: deletedFeedback[0] });
  },
);

// ─── PATCH /:id ───────────────────────────────────────────────────────────────

feedbackApp.patch(
  "/:id",
  describeRoute({
    tags: ["Feedbacks"],
    summary: "Update feedback",
    description: "Memperbarui pesan feedback berdasarkan ID.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Feedback berhasil diperbarui",
        content: {
          "application/json": {
            schema: resolver(z.object({ data: FeedbackSchema })),
          },
        },
      },
      400: {
        description: "Validasi gagal",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
      404: {
        description: "Feedback tidak ditemukan",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
    },
  }),
  zValidator("param", ParamSchema),
  zValidator("json", updateFeedbackSchema),
  async (c) => {
    const user = c.get("user");
    const id = Number(c.req.valid("param").id);
    const body = c.req.valid("json");

    const updatedFeedback = await db
      .update(feedbacks)
      .set({ message: body.message })
      .where(and(eq(feedbacks.id, id), eq(feedbacks.userId, user!.id)))
      .returning();

    if (updatedFeedback.length === 0) {
      return c.json({ error: "Feedback tidak ditemukan" }, 404);
    }

    return c.json({ data: updatedFeedback[0] });
  },
);

export default feedbackApp;
