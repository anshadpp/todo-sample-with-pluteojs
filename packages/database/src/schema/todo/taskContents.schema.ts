import {
	pgTable,
	text,
	integer,
	timestamp,
	uuid,
	index,
} from "drizzle-orm/pg-core";

import {users} from "../betterAuth/betterAuth.schema";
import {tasks} from "./tasks.schema";

export const taskContents = pgTable(
	"task_contents",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		taskId: uuid("task_id")
			.notNull()
			.references(() => tasks.id, {onDelete: "cascade"}),
		createdById: uuid("created_by_id")
			.notNull()
			.references(() => users.id, {onDelete: "cascade"}),
		type: text("type").notNull(), // "code" | "doc" | "link" | "note"
		title: text("title"),
		content: text("content").notNull(),
		language: text("language"), // for code snippets (e.g. "javascript", "python")
		url: text("url"), // for links
		sortOrder: integer("sort_order").default(0).notNull(),
		createdAt: timestamp("created_at", {withTimezone: true})
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", {withTimezone: true})
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("taskContents_taskId_idx").on(table.taskId),
		index("taskContents_createdById_idx").on(table.createdById),
		index("taskContents_type_idx").on(table.type),
	]
);

export type TaskContent = typeof taskContents.$inferSelect;
export type NewTaskContent = typeof taskContents.$inferInsert;
