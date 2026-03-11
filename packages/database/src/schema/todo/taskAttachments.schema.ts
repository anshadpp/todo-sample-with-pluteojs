import {
	pgTable,
	text,
	timestamp,
	uuid,
	integer,
	index,
} from "drizzle-orm/pg-core";

import {users} from "../betterAuth/betterAuth.schema";
import {tasks} from "./tasks.schema";

export const taskAttachments = pgTable(
	"task_attachments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		taskId: uuid("task_id")
			.notNull()
			.references(() => tasks.id, {onDelete: "cascade"}),
		uploadedById: uuid("uploaded_by_id")
			.notNull()
			.references(() => users.id, {onDelete: "cascade"}),
		fileName: text("file_name").notNull(),
		fileUrl: text("file_url").notNull(),
		fileSize: integer("file_size").notNull(),
		mimeType: text("mime_type").notNull(),
		createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull(),
	},
	(table) => [
		index("taskAttachments_taskId_idx").on(table.taskId),
	],
);

export type TaskAttachment = typeof taskAttachments.$inferSelect;
export type NewTaskAttachment = typeof taskAttachments.$inferInsert;
