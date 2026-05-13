import { Hono } from "hono";
import { describeRoute, validator as zValidator, resolver } from "hono-openapi";
import { eq, and, desc } from "drizzle-orm";
import z from "zod";
import { db } from "../db/db";
import { moods } from "../schema/Moods";
import {
  insertMoodSchema,
  selectMoodSchema,
} from "../validators/app-validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppVariables } from "@/types/type";

const moodApp = new Hono<{ Variables: AppVariables }>();

moodApp.use("*", authMiddleware);

// ─── Schemas ──────────────────────────────────────────────────────────────────

const DataResponse = z.object({ data: selectMoodSchema });
const ListResponse = z.object({ data: z.array(selectMoodSchema) });
const ErrorSchema = z.object({ error: z.string() }).meta({ ref: "MoodError" });

const ParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
});

// ─── POST / ───────────────────────────────────────────────────────────────────

moodApp.post(
  "/",
  describeRoute({
    tags: ["Moods"],
    summary: "Tambah mood baru",
    description: "Menyimpan entri mood untuk user yang sedang login.",
    security: [{ bearerAuth: [] }],
    responses: {
      201: {
        description: "Mood berhasil dibuat",
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
  zValidator("json", insertMoodSchema),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");

    const newMood = await db
      .insert(moods)
      .values({ ...body, userId: user!.id })
      .returning();

    return c.json({ data: newMood[0] }, 201);
  },
);

// ─── GET / ────────────────────────────────────────────────────────────────────

moodApp.get(
  "/",
  describeRoute({
    tags: ["Moods"],
    summary: "Daftar semua mood",
    description:
      "Mengambil semua mood milik user yang sedang login, diurutkan terbaru.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Daftar mood",
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
      .from(moods)
      .where(eq(moods.userId, user!.id))
      .orderBy(desc(moods.createdAt));

    return c.json({ data });
  },
);

// ─── GET /:id ─────────────────────────────────────────────────────────────────

moodApp.get(
  "/:id",
  describeRoute({
    tags: ["Moods"],
    summary: "Detail mood",
    description: "Mengambil satu entri mood berdasarkan ID.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Mood ditemukan",
        content: {
          "application/json": {
            schema: resolver(DataResponse),
          },
        },
      },
      404: {
        description: "Mood tidak ditemukan",
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
      .from(moods)
      .where(and(eq(moods.id, id), eq(moods.userId, user!.id)));

    if (data.length === 0) {
      return c.json({ error: "Mood tidak ditemukan" }, 404);
    }

    return c.json({ data: data[0] });
  },
);

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

moodApp.delete(
  "/:id",
  describeRoute({
    tags: ["Moods"],
    summary: "Hapus mood",
    description: "Menghapus entri mood berdasarkan ID.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Mood berhasil dihapus",
        content: {
          "application/json": {
            schema: resolver(DataResponse),
          },
        },
      },
      404: {
        description: "Mood tidak ditemukan",
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

    const deletedMood = await db
      .delete(moods)
      .where(and(eq(moods.id, id), eq(moods.userId, user!.id)))
      .returning();

    if (deletedMood.length === 0) {
      return c.json({ error: "Mood tidak ditemukan" }, 404);
    }

    return c.json({ data: deletedMood[0] });
  },
);

export default moodApp;
