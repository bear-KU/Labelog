CREATE TYPE "gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"address" text,
	"genre" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"business_hours" text,
	"closed_days" text,
	"url" text,
	"thumbnail_public_id" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"gender" "gender",
	"birth_date" date,
	"is_approved" boolean DEFAULT false NOT NULL,
	"role" "user_role" DEFAULT 'member'::"user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
