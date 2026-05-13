import { Hono } from "hono";
import { auth } from "@/lib/auth";
import { cors } from "hono/cors";
import { openAPIRouteHandler } from "hono-openapi";
import { swaggerUI } from "@hono/swagger-ui";

import { AppVariables } from "./types/type";

import todoApp from "./routes/todos.route";
import feedbackApp from "./routes/feedbacks.route";
import pomodoroApp from "./routes/pomodoro.route";
import moodApp from "./routes/moods.route";
import journalApp from "./routes/journals.route";

// ─── Routes App ───────────────────────────────────────────────────────────────
// Instance terpisah khusus untuk route aplikasi.
// Dipisah agar openAPIRouteHandler bisa scan tanpa middleware global.
const routes = new Hono<{ Variables: AppVariables }>();

routes.route("/todos", todoApp);
routes.route("/feedbacks", feedbackApp);
routes.route("/pomodoros", pomodoroApp);
routes.route("/moods", moodApp);
routes.route("/journals", journalApp);

// ─── Main App ─────────────────────────────────────────────────────────────────
const app = new Hono<{ Variables: AppVariables }>();

app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposeHeaders: ["Content-Length", "Set-Cookie"],
    credentials: true,
  }),
);

// Better Auth handler
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Mount semua route
app.route("/", routes);

// ─── OpenAPI Spec ──────────────────────────────────────────────────────────────
app.get(
  "/openapi.json",
  openAPIRouteHandler(routes, {
    documentation: {
      info: {
        title: "MindTrack API",
        version: "1.0.0",
        description:
          "REST API untuk manajemen mood, jurnal, pomodoro, todo, dan feedback.",
      },
      paths: {
        // Better Auth — Sign Up
        "/api/auth/sign-up/email": {
          post: {
            tags: ["Auth"],
            summary: "Register akun baru",
            security: [],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["name", "email", "password"],
                    properties: {
                      name: { type: "string", example: "John Doe" },
                      email: { type: "string", example: "john@example.com" },
                      password: { type: "string", example: "secret123" },
                    },
                  },
                },
              },
            },
            responses: {
              200: { description: "Akun berhasil dibuat" },
              400: { description: "Validasi gagal atau email sudah terdaftar" },
            },
          },
        },

        // Better Auth — Sign In
        "/api/auth/sign-in/email": {
          post: {
            tags: ["Auth"],
            summary: "Login dengan email & password",
            security: [],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                      email: { type: "string", example: "john@example.com" },
                      password: { type: "string", example: "secret123" },
                    },
                  },
                },
              },
            },
            responses: {
              200: { description: "Login berhasil, session cookie di-set" },
              401: { description: "Email atau password salah" },
            },
          },
        },

        // Better Auth — Sign Out
        "/api/auth/sign-out": {
          post: {
            tags: ["Auth"],
            summary: "Logout",
            security: [{ bearerAuth: [] }],
            responses: {
              200: { description: "Logout berhasil" },
            },
          },
        },

        // Better Auth — Get Session
        "/api/auth/get-session": {
          get: {
            tags: ["Auth"],
            summary: "Ambil session saat ini",
            security: [{ bearerAuth: [] }],
            responses: {
              200: { description: "Data session user" },
              401: { description: "Tidak terautentikasi" },
            },
          },
        },

        // Admin Plugin — List Users
        "/api/auth/admin/list-users": {
          get: {
            tags: ["Admin"],
            summary: "Daftar semua user",
            description: "Hanya bisa diakses oleh user dengan role admin.",
            security: [{ bearerAuth: [] }],
            parameters: [
              {
                name: "limit",
                in: "query",
                schema: { type: "number", example: 10 },
              },
              {
                name: "offset",
                in: "query",
                schema: { type: "number", example: 0 },
              },
            ],
            responses: {
              200: { description: "Daftar user berhasil diambil" },
              403: { description: "Forbidden — bukan admin" },
            },
          },
        },

        // Admin Plugin — Ban User
        "/api/auth/admin/ban-user": {
          post: {
            tags: ["Admin"],
            summary: "Ban user",
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["userId"],
                    properties: {
                      userId: { type: "string", example: "user_abc123" },
                      banReason: {
                        type: "string",
                        example: "Melanggar aturan",
                      },
                      banExpiresIn: {
                        type: "number",
                        example: 86400,
                        description: "Durasi ban dalam detik",
                      },
                    },
                  },
                },
              },
            },
            responses: {
              200: { description: "User berhasil di-ban" },
              403: { description: "Forbidden — bukan admin" },
            },
          },
        },

        // Admin Plugin — Unban User
        "/api/auth/admin/unban-user": {
          post: {
            tags: ["Admin"],
            summary: "Unban user",
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["userId"],
                    properties: {
                      userId: { type: "string", example: "user_abc123" },
                    },
                  },
                },
              },
            },
            responses: {
              200: { description: "User berhasil di-unban" },
              403: { description: "Forbidden — bukan admin" },
            },
          },
        },
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Development server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Masukkan session token dari Better Auth",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }),
);

// ─── Swagger UI ────────────────────────────────────────────────────────────────
app.get("/ui", swaggerUI({ url: "/openapi.json" }));

export default app;
