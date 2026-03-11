import {relations} from "drizzle-orm";
import {
	pgTable,
	text,
	timestamp,
	uuid,
	integer,
	index,
} from "drizzle-orm/pg-core";

import {boards} from "./boards.schema";

export const categories = pgTable(
	"categories",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		boardId: uuid("board_id")
			.notNull()
			.references(() => boards.id, {onDelete: "cascade"}),
		name: text("name").notNull(),
		color: text("color"),
		sortOrder: integer("sort_order").default(0).notNull(),
		wipLimit: integer("wip_limit"),
		createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", {withTimezone: true})
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("categories_boardId_idx").on(table.boardId),
	],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
