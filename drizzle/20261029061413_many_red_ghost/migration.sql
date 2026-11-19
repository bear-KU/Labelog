ALTER TABLE "restaurants" ADD COLUMN "business_hours_note" text;--> statement-breakpoint
ALTER TABLE "restaurants" DROP COLUMN "closed_days";--> statement-breakpoint
ALTER TABLE "restaurants" ALTER COLUMN "business_hours" SET DATA TYPE jsonb USING "business_hours"::jsonb;