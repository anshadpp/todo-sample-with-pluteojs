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

import {users} from "../betterAuth/betterAuth.schema";
import {projects} from "../project/projects.schema";
import {categories} from "../project/categories.schema";

export const tasks = pgTable(
	"tasks",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, {onDelete: "cascade"}),
		categoryId: uuid("category_id").references(() => categories.id, {
			onDelete: "set null",
		}),
		createdById: uuid("created_by_id")
			.notNull()
			.references(() => users.id, {onDelete: "cascade"}),
		assigneeId: uuid("assignee_id").references(() => users.id, {
			onDelete: "set null",
		}),
		title: text("title").notNull(),
		description: text("description"),
		priority: text("priority").default("medium").notNull(),
		status: text("status").default("todo").notNull(),
		sortOrder: integer("sort_order").default(0).notNull(),
		dueAt: timestamp("due_at", {withTimezone: true}),
		startAt: timestamp("start_at", {withTimezone: true}),
		estimatedMinutes: integer("estimated_minutes"),
		effortLevel: text("effort_level"),
		coverImage: text("cover_image"),
		isArchived: boolean("is_archived").default(false).notNull(),
		completedAt: timestamp("completed_at", {withTimezone: true}),
		createdAt: timestamp("created_at", {withTimezone: true})
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", {withTimezone: true})
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("tasks_projectId_idx").on(table.projectId),
		index("tasks_categoryId_idx").on(table.categoryId),
		index("tasks_assigneeId_idx").on(table.assigneeId),
		index("tasks_createdById_idx").on(table.createdById),
		index("tasks_status_idx").on(table.status),
		index("tasks_priority_idx").on(table.priority),
		index("tasks_dueAt_idx").on(table.dueAt),
	]
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
