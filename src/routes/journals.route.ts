import { Hono } from "hono";
import { describeRoute, validator as zValidator, resolver } from "hono-openapi";
import { eq, and, desc } from "drizzle-orm";
import z from "zod";
import { db } from "../db/db";
import { journals } from "../schema/Journals";
import {
  insertJournalSchema,
  updateJournalSchema,
  selectJournalSchema,
} from "../validators/app-validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppVariables } from "@/types/type";

const journalApp = new Hono<{ Variables: AppVariables }>();

journalApp.use("*", authMiddleware);

// ─── Schemas ──────────────────────────────────────────────────────────────────
const DataResponse = z.object({ data: selectJournalSchema });
const ListResponse = z.object({ data: z.array(selectJournalSchema) });
const ErrorSchema = z
  .object({ error: z.string() })
  .meta({ ref: "JournalError" });

const ParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
});

// ─── POST / ───────────────────────────────────────────────────────────────────

journalApp.post(
  "/",
  describeRoute({
    tags: ["Journals"],
    summary: "Buat jurnal baru",
    description: "Menyimpan entri jurnal baru untuk user yang sedang login.",
    security: [{ bearerAuth: [] }],
    responses: {
      201: {
        description: "Jurnal berhasil dibuat",
        content: {
          "application/json": {
            schema: resolver(DataResponse),
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
  zValidator("json", insertJournalSchema),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");

    const newJournal = await db
      .insert(journals)
      .values({ ...body, userId: user!.id })
      .returning();

    return c.json({ data: newJournal[0] }, 201);
  },
);

// ─── GET / ────────────────────────────────────────────────────────────────────

journalApp.get(
  "/",
  describeRoute({
    tags: ["Journals"],
    summary: "Daftar semua jurnal",
    description:
      "Mengambil semua jurnal milik user yang sedang login, diurutkan terbaru.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Daftar jurnal",
        content: {
          "application/json": {
            schema: resolver(ListResponse),
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
      .from(journals)
      .where(eq(journals.userId, user!.id))
      .orderBy(desc(journals.createdAt));

    return c.json({ data });
  },
);

// ─── GET /:id ─────────────────────────────────────────────────────────────────

journalApp.get(
  "/:id",
  describeRoute({
    tags: ["Journals"],
    summary: "Detail jurnal",
    description: "Mengambil satu entri jurnal berdasarkan ID.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Jurnal ditemukan",
        content: {
          "application/json": {
            schema: resolver(DataResponse),
          },
        },
      },
      404: {
        description: "Jurnal tidak ditemukan",
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
      .from(journals)
      .where(and(eq(journals.id, id), eq(journals.userId, user!.id)));

    if (data.length === 0) {
      return c.json({ error: "Jurnal tidak ditemukan" }, 404);
    }

    return c.json({ data: data[0] });
  },
);

// ─── PATCH /:id ───────────────────────────────────────────────────────────────

journalApp.patch(
  "/:id",
  describeRoute({
    tags: ["Journals"],
    summary: "Update jurnal",
    description: "Memperbarui sebagian field jurnal berdasarkan ID.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Jurnal berhasil diperbarui",
        content: {
          "application/json": {
            schema: resolver(DataResponse),
          },
        },
      },
      400: {
        description: "Validasi gagal",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
      404: {
        description: "Jurnal tidak ditemukan",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
    },
  }),
  zValidator("param", ParamSchema),
  zValidator("json", updateJournalSchema),
  async (c) => {
    const user = c.get("user");
    const id = Number(c.req.valid("param").id);
    const body = c.req.valid("json");

    const updatedJournal = await db
      .update(journals)
      .set(body)
      .where(and(eq(journals.id, id), eq(journals.userId, user!.id)))
      .returning();

    if (updatedJournal.length === 0) {
      return c.json({ error: "Jurnal tidak ditemukan" }, 404);
    }

    return c.json({ data: updatedJournal[0] });
  },
);

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

journalApp.delete(
  "/:id",
  describeRoute({
    tags: ["Journals"],
    summary: "Hapus jurnal",
    description: "Menghapus entri jurnal berdasarkan ID.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Jurnal berhasil dihapus",
        content: {
          "application/json": {
            schema: resolver(DataResponse),
          },
        },
      },
      404: {
        description: "Jurnal tidak ditemukan",
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

    const deletedJournal = await db
      .delete(journals)
      .where(and(eq(journals.id, id), eq(journals.userId, user!.id)))
      .returning();

    if (deletedJournal.length === 0) {
      return c.json({ error: "Jurnal tidak ditemukan" }, 404);
    }

    return c.json({ data: deletedJournal[0] });
  },
);

export default journalApp;
