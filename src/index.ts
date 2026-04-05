import { Hono } from "hono";
import { auth } from "@/lib/auth";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import { users } from "./schema/auth-schema";
import { todos } from "./schema/app-schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
export const db = drizzle(pool);

import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { insertTodoSchema } from "./validators/app-validator";

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

app.use(
  "*",
  cors({
    origin: "http://localhost:5173", // Tambahkan 'null' jika buka file langsung
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    credentials: true,
  }),
);
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/api/todos", zValidator("json", insertTodoSchema), (c) => {
  const data = c.req.valid("json");
  return c.json({ message: "Todo valid!", data });
});

app.get("/api/test-db", async (c) => {
  try {
    await db.insert(users).values({
      id: "tester-123",
      name: "Tester Database",
      email: "tester@dailymind.com",
    }).onConflictDoNothing();

    await db.insert(todos).values({
      userId: "tester-123",
      task: "Tes Write ke Database PostgreSQL",
      priority: "tinggi",
      date: new Date().toISOString().split("T")[0],
    });

    const hasilRead = await db.select().from(todos).where(
      eq(todos.userId, "tester-123")
    );

    return c.json({
      status: "Berhasil",
      message: "Koneksi Read/Write ke PostgreSQL sukses tanpa error!",
      data: hasilRead
    });
  } catch (error) {
    return c.json({
      status: "Gagal",
      message: "Terjadi error saat koneksi ke database",
      error: String(error)
    }, 500);
  }
});

export default app;
