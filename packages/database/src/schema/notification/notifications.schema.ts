import {relations} from "drizzle-orm";
import {
	pgTable,
	text,
	boolean,
	timestamp,
	uuid,
	index,
} from "drizzle-orm/pg-core";

import {users} from "../betterAuth/betterAuth.schema";

export const notifications = pgTable(
	"notifications",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, {onDelete: "cascade"}),
		type: text("type").notNull(),
		title: text("title").notNull(),
		body: text("body"),
		resourceType: text("resource_type"),
		resourceId: uuid("resource_id"),
		isRead: boolean("is_read").default(false).notNull(),
		readAt: timestamp("read_at", {withTimezone: true}),
		createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull(),
	},
	(table) => [
		index("notifications_userId_idx").on(table.userId),
		index("notifications_isRead_idx").on(table.isRead),
		index("notifications_createdAt_idx").on(table.createdAt),
	],
);

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id],
	}),
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
