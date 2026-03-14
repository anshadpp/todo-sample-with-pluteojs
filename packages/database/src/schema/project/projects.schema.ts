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
import {organizations} from "../betterAuth/betterAuth.schema";

export const projects = pgTable(
	"projects",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		description: text("description"),
		slug: text("slug").notNull(),
		organizationId: uuid("organization_id").references(() => organizations.id, {
			onDelete: "cascade",
		}),
		createdById: uuid("created_by_id")
			.notNull()
			.references(() => users.id, {onDelete: "cascade"}),
		color: text("color"),
		icon: text("icon"),
		isArchived: boolean("is_archived").default(false).notNull(),
		createdAt: timestamp("created_at", {withTimezone: true})
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", {withTimezone: true})
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("projects_organizationId_idx").on(table.organizationId),
		index("projects_createdById_idx").on(table.createdById),
		index("projects_slug_idx").on(table.slug),
	]
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
