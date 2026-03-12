import {relations} from "drizzle-orm";
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

export const boards = pgTable(
	"boards",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, {onDelete: "cascade"}),
		name: text("name").notNull(),
		description: text("description"),
		type: text("type").default("status").notNull(),
		isDefault: boolean("is_default").default(false).notNull(),
		sortOrder: integer("sort_order").default(0).notNull(),
		createdAt: timestamp("created_at", {withTimezone: true})
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", {withTimezone: true})
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("boards_projectId_idx").on(table.projectId)]
);

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;
