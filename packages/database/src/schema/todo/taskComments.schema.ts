import {
	pgTable,
	text,
	boolean,
	timestamp,
	uuid,
	index,
} from "drizzle-orm/pg-core";

import {users} from "../betterAuth/betterAuth.schema";
import {tasks} from "./tasks.schema";

export const taskComments = pgTable(
	"task_comments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		taskId: uuid("task_id")
			.notNull()
			.references(() => tasks.id, {onDelete: "cascade"}),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, {onDelete: "cascade"}),
		content: text("content").notNull(),
		parentId: uuid("parent_id"),
		isEdited: boolean("is_edited").default(false).notNull(),
		createdAt: timestamp("created_at", {withTimezone: true})
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", {withTimezone: true})
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("taskComments_taskId_idx").on(table.taskId),
		index("taskComments_userId_idx").on(table.userId),
		index("taskComments_parentId_idx").on(table.parentId),
	]
);

export type TaskComment = typeof taskComments.$inferSelect;
export type NewTaskComment = typeof taskComments.$inferInsert;
