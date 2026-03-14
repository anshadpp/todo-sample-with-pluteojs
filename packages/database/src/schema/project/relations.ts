import {relations} from "drizzle-orm";

import {users, organizations} from "../betterAuth/betterAuth.schema";
import {projects} from "./projects.schema";
import {boards} from "./boards.schema";
import {categories} from "./categories.schema";
import {autoSortRules} from "./autoSortRules.schema";

export const projectsRelations = relations(projects, ({one, many}) => ({
	organization: one(organizations, {
		fields: [projects.organizationId],
		references: [organizations.id],
	}),
	createdBy: one(users, {
		fields: [projects.createdById],
		references: [users.id],
	}),
	boards: many(boards),
	autoSortRules: many(autoSortRules),
}));

export const autoSortRulesRelations = relations(autoSortRules, ({one}) => ({
	project: one(projects, {
		fields: [autoSortRules.projectId],
		references: [projects.id],
	}),
}));

export const boardsRelations = relations(boards, ({one, many}) => ({
	project: one(projects, {
		fields: [boards.projectId],
		references: [projects.id],
	}),
	categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({one, many}) => ({
	board: one(boards, {
		fields: [categories.boardId],
		references: [boards.id],
	}),
}));
