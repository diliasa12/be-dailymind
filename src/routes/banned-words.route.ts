import { Hono } from "hono";
import { describeRoute, validator as zValidator, resolver } from "hono-openapi";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/db";
import { bannedWords } from "../schema/Bannedwords";
import {
  insertBannedWordSchema,
  selectBannedWordSchema,
} from "../validators/app-validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";
import { AppVariables } from "@/types/type";

const bannedWordsApp = new Hono<{ Variables: AppVariables }>();

bannedWordsApp.use("*", authMiddleware);

// ─── Shared Schemas ───────────────────────────────────────────────────────────

const ListResponse = z.object({ data: z.array(selectBannedWordSchema) });
const MessageResponse = z.object({
  message: z.string(),
  data: selectBannedWordSchema,
});
const ErrorResponse = z.object({ error: z.string() });
const ParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
});

// ─── GET / ────────────────────────────────────────────────────────────────────

bannedWordsApp.get(
  "/",
  describeRoute({
    tags: ["Banned Words"],
    summary: "Daftar kata terlarang",
    description: "Mengambil seluruh daftar kata terlarang yang aktif.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Daftar kata terlarang berhasil diambil",
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
    const data = await db.select().from(bannedWords);
    return c.json({ data });
  },
);

// ─── POST / ───────────────────────────────────────────────────────────────────

bannedWordsApp.post(
  "/",
  adminMiddleware,
  describeRoute({
    tags: ["Banned Words (Admin)"],
    summary: "Tambah kata terlarang",
    description:
      "Menambahkan kata baru ke daftar sensor. Gagal jika kata sudah terdaftar. Hanya admin.",
    security: [{ bearerAuth: [] }],
    responses: {
      201: {
        description: "Kata berhasil ditambahkan",
        content: { "application/json": { schema: resolver(MessageResponse) } },
      },
      400: {
        description: "Kata sudah terdaftar atau validasi gagal",
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
  zValidator("json", insertBannedWordSchema),
  async (c) => {
    const { word } = c.req.valid("json");
    const normalized = word.toLowerCase();

    const existing = await db
      .select()
      .from(bannedWords)
      .where(eq(bannedWords.word, normalized));

    if (existing.length > 0) {
      return c.json({ error: "Kata sudah terdaftar" }, 400);
    }

    const newWord = await db
      .insert(bannedWords)
      .values({ word: normalized })
      .returning();

    return c.json(
      { message: "Kata berhasil ditambahkan", data: newWord[0] },
      201,
    );
  },
);

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

bannedWordsApp.delete(
  "/:id",
  adminMiddleware,
  describeRoute({
    tags: ["Banned Words (Admin)"],
    summary: "Hapus kata terlarang",
    description:
      "Menghapus kata secara permanen dari daftar sensor. Hanya admin.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Kata berhasil dihapus",
        content: { "application/json": { schema: resolver(MessageResponse) } },
      },
      404: {
        description: "Kata tidak ditemukan",
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
  async (c) => {
    const id = Number(c.req.valid("param").id);

    const deleted = await db
      .delete(bannedWords)
      .where(eq(bannedWords.id, id))
      .returning();

    if (deleted.length === 0) {
      return c.json({ error: "Kata tidak ditemukan" }, 404);
    }

    return c.json({ message: "Kata berhasil dihapus", data: deleted[0] });
  },
);

export default bannedWordsApp;
