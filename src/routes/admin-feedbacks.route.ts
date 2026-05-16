import { Hono } from "hono";
import { describeRoute, validator as zValidator, resolver } from "hono-openapi";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/db";
import { feedbacks } from "../schema/Feedbacks";
import {
  selectFeedbackSchema,
  updateFeedbackStatusSchema,
} from "../validators/app-validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppVariables } from "@/types/type";

const adminFeedbackApp = new Hono<{ Variables: AppVariables }>();

adminFeedbackApp.use("*", authMiddleware);

// ─── Guard: Admin Only ────────────────────────────────────────────────────────

adminFeedbackApp.use("*", async (c, next) => {
  const user = c.get("user") as
    | (typeof import("@/lib/auth").auth.$Infer.Session.user & {
        role?: string | null;
      })
    | null;

  if (!user || user.role !== "admin") {
    return c.json(
      { error: "Forbidden: hanya admin yang dapat mengakses endpoint ini" },
      403,
    );
  }

  await next();
});

// ─── Shared Schemas ───────────────────────────────────────────────────────────

const ListResponse = z.object({ data: z.array(selectFeedbackSchema) });
const UpdateResponse = z.object({
  message: z.string(),
  data: selectFeedbackSchema,
});
const ErrorResponse = z.object({ error: z.string() });
const ParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
});

// ─── GET / ────────────────────────────────────────────────────────────────────

adminFeedbackApp.get(
  "/",
  describeRoute({
    tags: ["Feedback Management (Admin)"],
    summary: "Daftar semua feedback user",
    description:
      "Mengambil seluruh feedback dari semua user beserta ID, kategori, isi laporan, timestamp, dan status. Diurutkan terbaru. Hanya admin.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Daftar feedback berhasil diambil",
        content: { "application/json": { schema: resolver(ListResponse) } },
      },
      403: {
        description: "Forbidden — bukan admin",
        content: { "application/json": { schema: resolver(ErrorResponse) } },
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: resolver(ErrorResponse) } },
      },
    },
  }),
  async (c) => {
    const data = await db
      .select()
      .from(feedbacks)
      .orderBy(desc(feedbacks.createdAt));

    return c.json({ data });
  },
);

// ─── PATCH /:id/status ────────────────────────────────────────────────────────

adminFeedbackApp.patch(
  "/:id/status",
  describeRoute({
    tags: ["Feedback Management (Admin)"],
    summary: "Update status feedback",
    description:
      'Menandai feedback sebagai "read" atau "resolved". Tombol "Tandai Selesai" di UI memanggil endpoint ini dengan status "resolved".',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Laporan berhasil diupdate",
        content: { "application/json": { schema: resolver(UpdateResponse) } },
      },
      400: {
        description: "Validasi gagal",
        content: { "application/json": { schema: resolver(ErrorResponse) } },
      },
      404: {
        description: "Feedback tidak ditemukan",
        content: { "application/json": { schema: resolver(ErrorResponse) } },
      },
      403: {
        description: "Forbidden — bukan admin",
        content: { "application/json": { schema: resolver(ErrorResponse) } },
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: resolver(ErrorResponse) } },
      },
    },
  }),
  zValidator("param", ParamSchema),
  zValidator("json", updateFeedbackStatusSchema),
  async (c) => {
    const id = Number(c.req.valid("param").id);
    const { status } = c.req.valid("json");

    const updated = await db
      .update(feedbacks)
      .set({ status })
      .where(eq(feedbacks.id, id))
      .returning();

    if (updated.length === 0) {
      return c.json({ error: "Feedback tidak ditemukan" }, 404);
    }

    return c.json({ message: "Laporan berhasil diupdate", data: updated[0] });
  },
);

export default adminFeedbackApp;
