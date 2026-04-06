import { Hono } from "hono";
import { auth } from "@/lib/auth";
import { cors } from "hono/cors";
import { authMiddleware } from "./middlewares/auth.middlware";
import { AppVariables } from "./types/type";

const app = new Hono<{
  Variables: AppVariables;
}>();

app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"], // Tambahkan 'null' jika buka file langsung
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"], // ✅ tambah Cookie
    exposeHeaders: ["Content-Length", "Set-Cookie"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.get("/", (c) => {
  return c.text("hello dili");
});

export default app;
