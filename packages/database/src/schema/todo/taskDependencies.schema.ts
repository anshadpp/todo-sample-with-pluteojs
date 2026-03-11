import {
	pgTable,
	text,
	timestamp,
	uuid,
	index,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import {tasks} from "./tasks.schema";

/**
 * Task dependencies junction table.
 * A row means: `dependentTaskId` depends on `dependsOnTaskId`.
 * i.e., dependentTask cannot start until dependsOnTask is completed.
 */
export const taskDependencies = pgTable(
	"task_dependencies",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		dependentTaskId: uuid("dependent_task_id")
			.notNull()
			.references(() => tasks.id, {onDelete: "cascade"}),
		dependsOnTaskId: uuid("depends_on_task_id")
			.notNull()
			.references(() => tasks.id, {onDelete: "cascade"}),
		dependencyType: text("dependency_type").default("blocks").notNull(),
		createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull(),
	},
	(table) => [
		index("task_deps_dependent_idx").on(table.dependentTaskId),
		index("task_deps_depends_on_idx").on(table.dependsOnTaskId),
		uniqueIndex("task_deps_unique_idx").on(table.dependentTaskId, table.dependsOnTaskId),
	],
);

export type TaskDependency = typeof taskDependencies.$inferSelect;
export type NewTaskDependency = typeof taskDependencies.$inferInsert;
