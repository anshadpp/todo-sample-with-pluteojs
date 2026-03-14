import {
	pgTable,
	text,
	boolean,
	timestamp,
	uuid,
	integer,
	index,
} from "drizzle-orm/pg-core";

import {projects} from "./projects.schema";

export const autoSortRules = pgTable(
	"auto_sort_rules",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, {onDelete: "cascade"}),
		name: text("name").notNull(),
		description: text("description"),
		conditionField: text("condition_field").notNull(),
		conditionOperator: text("condition_operator").notNull(),
		conditionValue: text("condition_value"),
		actionType: text("action_type").notNull(),
		actionValue: text("action_value").notNull(),
		isEnabled: boolean("is_enabled").default(true).notNull(),
		sortOrder: integer("sort_order").default(0).notNull(),
		stopOnMatch: boolean("stop_on_match").default(true).notNull(),
		createdAt: timestamp("created_at", {withTimezone: true})
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", {withTimezone: true})
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("autoSortRules_projectId_idx").on(table.projectId),
		index("autoSortRules_isEnabled_idx").on(table.isEnabled),
	]
);

export type AutoSortRule = typeof autoSortRules.$inferSelect;
export type NewAutoSortRule = typeof autoSortRules.$inferInsert;
