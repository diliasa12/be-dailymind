/**
 * routes/todo.route.ts
 * npm install hono-openapi zod-openapi
 */

import { Hono } from "hono";
import { describeRoute, validator as zValidator, resolver } from "hono-openapi";
import { eq, and } from "drizzle-orm";
import z from "zod";
import { db } from "../db/db";
import { todos } from "../schema/Todos";
import {
  insertTodoSchema,
  updateTodoSchema,
} from "../validators/app-validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppVariables } from "@/types/type";

const todoApp = new Hono<{ Variables: AppVariables }>();

todoApp.use("*", authMiddleware);

// ─── Schemas ──────────────────────────────────────────────────────────────────

const TodoSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    isCompleted: z.boolean(),
    completedAt: z.string().datetime().nullable(),
    userId: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .meta({ ref: "Todo" });

const ErrorSchema = z.object({ error: z.string() }).meta({ ref: "TodoError" });

const ParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
});

// ─── POST / ───────────────────────────────────────────────────────────────────

todoApp.post(
  "/",
  describeRoute({
    tags: ["Todos"],
    summary: "Tambah todo baru",
    description: "Menyimpan todo baru untuk user yang sedang login.",
    security: [{ bearerAuth: [] }],
    responses: {
      201: {
        description: "Todo berhasil dibuat",
        content: {
          "application/json": {
            schema: resolver(z.object({ data: TodoSchema })),
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
  zValidator("json", insertTodoSchema),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");

    const newTodo = await db
      .insert(todos)
      .values({ ...body, userId: user!.id })
      .returning();

    return c.json({ data: newTodo[0] }, 201);
  },
);

// ─── GET / ────────────────────────────────────────────────────────────────────

todoApp.get(
  "/",
  describeRoute({
    tags: ["Todos"],
    summary: "Daftar semua todo",
    description: "Mengambil semua todo milik user yang sedang login.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Daftar todo",
        content: {
          "application/json": {
            schema: resolver(z.object({ data: z.array(TodoSchema) })),
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
      .from(todos)
      .where(eq(todos.userId, user!.id));

    return c.json({ data });
  },
);

// ─── GET /:id ─────────────────────────────────────────────────────────────────

todoApp.get(
  "/:id",
  describeRoute({
    tags: ["Todos"],
    summary: "Detail todo",
    description: "Mengambil satu todo berdasarkan ID.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Todo ditemukan",
        content: {
          "application/json": {
            schema: resolver(z.object({ data: TodoSchema })),
          },
        },
      },
      404: {
        description: "Todo tidak ditemukan",
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
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, user!.id)));

    if (data.length === 0) {
      return c.json({ error: "Todo tidak ditemukan" }, 404);
    }

    return c.json({ data: data[0] });
  },
);

// ─── PATCH /:id ───────────────────────────────────────────────────────────────

todoApp.patch(
  "/:id",
  describeRoute({
    tags: ["Todos"],
    summary: "Update todo",
    description:
      "Memperbarui todo. Jika `isCompleted` diset true, `completedAt` otomatis diisi.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Todo berhasil diperbarui",
        content: {
          "application/json": {
            schema: resolver(z.object({ data: TodoSchema })),
          },
        },
      },
      400: {
        description: "Validasi gagal",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
      404: {
        description: "Todo tidak ditemukan",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
    },
  }),
  zValidator("param", ParamSchema),
  zValidator("json", updateTodoSchema),
  async (c) => {
    const user = c.get("user");
    const id = Number(c.req.valid("param").id);
    const body = c.req.valid("json");

    const updateData: Partial<typeof todos.$inferInsert> = { ...body };

    if (body.isCompleted === true) {
      updateData.completedAt = new Date();
    } else if (body.isCompleted === false) {
      updateData.completedAt = null;
    }

    const updatedTodo = await db
      .update(todos)
      .set(updateData)
      .where(and(eq(todos.id, id), eq(todos.userId, user!.id)))
      .returning();

    if (updatedTodo.length === 0) {
      return c.json({ error: "Todo tidak ditemukan" }, 404);
    }

    return c.json({ data: updatedTodo[0] });
  },
);

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

todoApp.delete(
  "/:id",
  describeRoute({
    tags: ["Todos"],
    summary: "Hapus todo",
    description: "Menghapus todo berdasarkan ID.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Todo berhasil dihapus",
        content: {
          "application/json": {
            schema: resolver(z.object({ data: TodoSchema })),
          },
        },
      },
      404: {
        description: "Todo tidak ditemukan",
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

    const deletedTodo = await db
      .delete(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, user!.id)))
      .returning();

    if (deletedTodo.length === 0) {
      return c.json({ error: "Todo tidak ditemukan" }, 404);
    }

    return c.json({ data: deletedTodo[0] });
  },
);

export default todoApp;
