CREATE TYPE "public"."role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'banned');--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "image" TO "role";--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "priority" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "priority" SET DEFAULT 'low'::text;--> statement-breakpoint
DROP TYPE "public"."priority";--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "priority" SET DEFAULT 'low'::"public"."priority";--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "priority" SET DATA TYPE "public"."priority" USING "priority"::"public"."priority";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" "status" DEFAULT 'active';