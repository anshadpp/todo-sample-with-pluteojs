ALTER TABLE "boards" ADD COLUMN "type" text DEFAULT 'status' NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "status_value" text;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'todo';
