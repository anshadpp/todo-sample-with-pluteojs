import {pgTable, text, timestamp, uuid, index} from "drizzle-orm/pg-core";

import {users} from "../betterAuth/betterAuth.schema";
import {tasks} from "./tasks.schema";

export const taskActivities = pgTable(
	"task_activities",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		taskId: uuid("task_id")
			.notNull()
			.references(() => tasks.id, {onDelete: "cascade"}),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, {onDelete: "cascade"}),
		action: text("action").notNull(),
		field: text("field"),
		oldValue: text("old_value"),
		newValue: text("new_value"),
		metadata: text("metadata"),
		createdAt: timestamp("created_at", {withTimezone: true})
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("taskActivities_taskId_idx").on(table.taskId),
		index("taskActivities_userId_idx").on(table.userId),
		index("taskActivities_createdAt_idx").on(table.createdAt),
	]
);

export type TaskActivity = typeof taskActivities.$inferSelect;
export type NewTaskActivity = typeof taskActivities.$inferInsert;
