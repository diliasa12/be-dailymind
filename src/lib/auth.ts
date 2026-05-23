import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "@/db/db"; // your drizzle instance
import * as schema from "@/schema/auth-schema";
import { openAPI } from "better-auth/plugins";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: user.email,
          subject: "Reset Password - DailyMind",
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
              <h2>Reset Password</h2>
              <p>Hi ${user.name || user.email},</p>
              <p>Klik tombol di bawah untuk reset password kamu. Link ini berlaku selama 1 jam.</p>
              <a href="${url}"
                 style="display:inline-block;margin:24px 0;padding:12px 24px;
                        background:#18181b;color:#fff;border-radius:6px;
                        text-decoration:none;font-weight:600;">
                Reset Password
              </a>
              <p style="color:#71717a;font-size:12px;">
                Jika kamu tidak meminta reset password, abaikan email ini.
              </p>
            </div>
          `,
        });
      } catch (error) {
        console.error("Failed to send reset password email:", error);
      }
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60,
    },
  },
  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL ?? "",
  ],
  advanced: {
    crossSubDomainCookies: {
      enabled: false,
    },
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
    },
  },
  baseURL: process.env.BETTER_AUTH_URL,
  socialProviders: {
    google: {
      accessType: "offline",
      prompt: "select_account consent",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [admin(), openAPI()],
});
