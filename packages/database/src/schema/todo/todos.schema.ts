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

export const todos = pgTable(
	"todos",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, {onDelete: "cascade"}),
		title: text("title").notNull(),
		description: text("description"),
		completed: boolean("completed").default(false).notNull(),
		dueAt: timestamp("due_at", {withTimezone: true}),
		notifyAt: timestamp("notify_at", {withTimezone: true}),
		notified: boolean("notified").default(false).notNull(),
		createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", {withTimezone: true})
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("todos_userId_idx").on(table.userId),
		index("todos_dueAt_idx").on(table.dueAt),
		index("todos_notifyAt_idx").on(table.notifyAt),
	],
);

// Relations
export const todosRelations = relations(todos, ({one}) => ({
	user: one(users, {
		fields: [todos.userId],
		references: [users.id],
	}),
}));

// Type inference helpers
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
