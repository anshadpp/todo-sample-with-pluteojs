import {
	pgTable,
	text,
	timestamp,
	uuid,
	index,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import {projects} from "../project/projects.schema";
import {tasks} from "./tasks.schema";

export const labels = pgTable(
	"labels",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, {onDelete: "cascade"}),
		name: text("name").notNull(),
		color: text("color").notNull(),
		createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull(),
	},
	(table) => [
		index("labels_projectId_idx").on(table.projectId),
	],
);

export const taskLabels = pgTable(
	"task_labels",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		taskId: uuid("task_id")
			.notNull()
			.references(() => tasks.id, {onDelete: "cascade"}),
		labelId: uuid("label_id")
			.notNull()
			.references(() => labels.id, {onDelete: "cascade"}),
	},
	(table) => [
		index("taskLabels_taskId_idx").on(table.taskId),
		index("taskLabels_labelId_idx").on(table.labelId),
		uniqueIndex("taskLabels_task_label_uidx").on(table.taskId, table.labelId),
	],
);

export type Label = typeof labels.$inferSelect;
export type NewLabel = typeof labels.$inferInsert;
export type TaskLabel = typeof taskLabels.$inferSelect;
export type NewTaskLabel = typeof taskLabels.$inferInsert;
