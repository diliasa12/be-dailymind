import { Hono } from "hono";
import { describeRoute, validator as zValidator, resolver } from "hono-openapi";
import { eq, and, desc } from "drizzle-orm";
import z from "zod";
import { db } from "../db/db";
import { pomodoros } from "../schema/Pomodoros";
import {
  insertPomodoroSchema,
  selectPomodoroSchema,
} from "../validators/app-validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppVariables } from "@/types/type";

const pomodoroApp = new Hono<{ Variables: AppVariables }>();
const ListResponse = z.object({ data: z.array(selectPomodoroSchema) });
const DataResponse = z.object({ data: selectPomodoroSchema });

pomodoroApp.use("*", authMiddleware);

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ErrorSchema = z
  .object({ error: z.string() })
  .meta({ ref: "PomodoroError" });

const ParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
});

// ─── POST / ───────────────────────────────────────────────────────────────────

pomodoroApp.post(
  "/",
  describeRoute({
    tags: ["Pomodoros"],
    summary: "Catat sesi pomodoro",
    description: "Menyimpan sesi pomodoro baru untuk user yang sedang login.",
    security: [{ bearerAuth: [] }],
    responses: {
      201: {
        description: "Pomodoro berhasil dicatat",
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
  zValidator("json", insertPomodoroSchema),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");

    const newPomodoro = await db
      .insert(pomodoros)
      .values({ ...body, userId: user!.id })
      .returning();

    return c.json({ data: newPomodoro[0] }, 201);
  },
);

// ─── GET / ────────────────────────────────────────────────────────────────────

pomodoroApp.get(
  "/",
  describeRoute({
    tags: ["Pomodoros"],
    summary: "Daftar semua pomodoro",
    description: "Mengambil semua sesi pomodoro milik user, diurutkan terbaru.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Daftar sesi pomodoro",
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
      .from(pomodoros)
      .where(eq(pomodoros.userId, user!.id))
      .orderBy(desc(pomodoros.createdAt));

    return c.json({ data });
  },
);

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

pomodoroApp.delete(
  "/:id",
  describeRoute({
    tags: ["Pomodoros"],
    summary: "Hapus sesi pomodoro",
    description: "Menghapus satu sesi pomodoro berdasarkan ID.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Pomodoro berhasil dihapus",
        content: {
          "application/json": {
            schema: resolver(DataResponse),
          },
        },
      },
      404: {
        description: "Data Pomodoro tidak ditemukan",
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

    const deletedPomodoro = await db
      .delete(pomodoros)
      .where(and(eq(pomodoros.id, id), eq(pomodoros.userId, user!.id)))
      .returning();

    if (deletedPomodoro.length === 0) {
      return c.json({ error: "Data Pomodoro tidak ditemukan" }, 404);
    }

    return c.json({ data: deletedPomodoro[0] });
  },
);

export default pomodoroApp;
