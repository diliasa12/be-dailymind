import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "@/db/db"; // your drizzle instance
import * as schema from "@/schema/auth-schema";
import { openAPI } from "better-auth/plugins";

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
