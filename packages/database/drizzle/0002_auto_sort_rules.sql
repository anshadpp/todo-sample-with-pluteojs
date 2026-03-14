CREATE TABLE IF NOT EXISTS "auto_sort_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"condition_field" text NOT NULL,
	"condition_operator" text NOT NULL,
	"condition_value" text,
	"action_type" text NOT NULL,
	"action_value" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"stop_on_match" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auto_sort_rules" ADD CONSTRAINT "auto_sort_rules_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "autoSortRules_projectId_idx" ON "auto_sort_rules" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "autoSortRules_isEnabled_idx" ON "auto_sort_rules" USING btree ("is_enabled");
