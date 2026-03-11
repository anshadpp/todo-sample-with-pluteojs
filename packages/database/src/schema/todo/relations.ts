import {relations} from "drizzle-orm";

import {users} from "../betterAuth/betterAuth.schema";
import {projects} from "../project/projects.schema";
import {categories} from "../project/categories.schema";
import {tasks} from "./tasks.schema";
import {taskComments} from "./taskComments.schema";
import {taskAttachments} from "./taskAttachments.schema";
import {taskActivities} from "./taskActivities.schema";
import {labels, taskLabels} from "./labels.schema";
import {taskDependencies} from "./taskDependencies.schema";
import {taskContents} from "./taskContents.schema";

export const tasksRelations = relations(tasks, ({one, many}) => ({
	project: one(projects, {
		fields: [tasks.projectId],
		references: [projects.id],
	}),
	category: one(categories, {
		fields: [tasks.categoryId],
		references: [categories.id],
	}),
	createdBy: one(users, {
		fields: [tasks.createdById],
		references: [users.id],
		relationName: "taskCreator",
	}),
	assignee: one(users, {
		fields: [tasks.assigneeId],
		references: [users.id],
		relationName: "taskAssignee",
	}),
	comments: many(taskComments),
	attachments: many(taskAttachments),
	activities: many(taskActivities),
	taskLabels: many(taskLabels),
	// Tasks that this task depends on (blockers)
	dependsOn: many(taskDependencies, {relationName: "dependentTask"}),
	// Tasks that depend on this task (blocked by this)
	dependedBy: many(taskDependencies, {relationName: "dependsOnTask"}),
	contents: many(taskContents),
}));

export const taskDependenciesRelations = relations(taskDependencies, ({one}) => ({
	dependentTask: one(tasks, {
		fields: [taskDependencies.dependentTaskId],
		references: [tasks.id],
		relationName: "dependentTask",
	}),
	dependsOnTask: one(tasks, {
		fields: [taskDependencies.dependsOnTaskId],
		references: [tasks.id],
		relationName: "dependsOnTask",
	}),
}));

export const taskCommentsRelations = relations(taskComments, ({one}) => ({
	task: one(tasks, {
		fields: [taskComments.taskId],
		references: [tasks.id],
	}),
	user: one(users, {
		fields: [taskComments.userId],
		references: [users.id],
	}),
	parent: one(taskComments, {
		fields: [taskComments.parentId],
		references: [taskComments.id],
		relationName: "commentReplies",
	}),
}));

export const taskAttachmentsRelations = relations(taskAttachments, ({one}) => ({
	task: one(tasks, {
		fields: [taskAttachments.taskId],
		references: [tasks.id],
	}),
	uploadedBy: one(users, {
		fields: [taskAttachments.uploadedById],
		references: [users.id],
	}),
}));

export const taskActivitiesRelations = relations(taskActivities, ({one}) => ({
	task: one(tasks, {
		fields: [taskActivities.taskId],
		references: [tasks.id],
	}),
	user: one(users, {
		fields: [taskActivities.userId],
		references: [users.id],
	}),
}));

export const labelsRelations = relations(labels, ({one, many}) => ({
	project: one(projects, {
		fields: [labels.projectId],
		references: [projects.id],
	}),
	taskLabels: many(taskLabels),
}));

export const taskContentsRelations = relations(taskContents, ({one}) => ({
	task: one(tasks, {
		fields: [taskContents.taskId],
		references: [tasks.id],
	}),
	createdBy: one(users, {
		fields: [taskContents.createdById],
		references: [users.id],
	}),
}));

export const taskLabelsRelations = relations(taskLabels, ({one}) => ({
	task: one(tasks, {
		fields: [taskLabels.taskId],
		references: [tasks.id],
	}),
	label: one(labels, {
		fields: [taskLabels.labelId],
		references: [labels.id],
	}),
}));
