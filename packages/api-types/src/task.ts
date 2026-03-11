import {z} from "zod";

import {uuidv4Schema} from "./common.js";

export const taskPriorityEnum = z.enum(["urgent", "high", "medium", "low", "none"]);
export const taskStatusEnum = z.enum(["open", "in_progress", "review", "done", "closed"]);
export const taskEffortLevelEnum = z.enum(["low", "medium", "high"]);

export const taskSchema = z.object({
	id: uuidv4Schema,
	projectId: uuidv4Schema,
	categoryId: uuidv4Schema.nullable(),
	createdById: uuidv4Schema,
	assigneeId: uuidv4Schema.nullable(),
	title: z.string().min(1, "Title is required"),
	description: z.string().nullable(),
	priority: taskPriorityEnum,
	status: taskStatusEnum,
	sortOrder: z.number(),
	dueAt: z.string().datetime().nullable(),
	startAt: z.string().datetime().nullable(),
	estimatedMinutes: z.number().nullable(),
	effortLevel: z.string().nullable(),
	coverImage: z.string().nullable(),
	isArchived: z.boolean(),
	completedAt: z.string().datetime().nullable(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const createTaskBodySchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	categoryId: uuidv4Schema.optional(),
	assigneeId: uuidv4Schema.optional(),
	priority: taskPriorityEnum.optional(),
	status: taskStatusEnum.optional(),
	dueAt: z.string().datetime().optional(),
	startAt: z.string().datetime().optional(),
	estimatedMinutes: z.number().positive().optional(),
	effortLevel: taskEffortLevelEnum.optional(),
	sortOrder: z.number().optional(),
});

export const updateTaskBodySchema = z.object({
	title: z.string().min(1).optional(),
	description: z.string().nullable().optional(),
	categoryId: uuidv4Schema.nullable().optional(),
	assigneeId: uuidv4Schema.nullable().optional(),
	priority: taskPriorityEnum.optional(),
	status: taskStatusEnum.optional(),
	dueAt: z.string().datetime().nullable().optional(),
	startAt: z.string().datetime().nullable().optional(),
	estimatedMinutes: z.number().positive().nullable().optional(),
	effortLevel: taskEffortLevelEnum.nullable().optional(),
	coverImage: z.string().nullable().optional(),
	isArchived: z.boolean().optional(),
	sortOrder: z.number().optional(),
});

export const moveTaskBodySchema = z.object({
	categoryId: uuidv4Schema,
	sortOrder: z.number(),
});

export const reorderTasksBodySchema = z.object({
	tasks: z.array(z.object({
		id: uuidv4Schema,
		sortOrder: z.number(),
	})),
});

export const taskResponseSchema = taskSchema;
export const taskListResponseSchema = z.array(taskSchema);

export type TaskItem = z.infer<typeof taskSchema>;
export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;
export type MoveTaskBody = z.infer<typeof moveTaskBodySchema>;
export type ReorderTasksBody = z.infer<typeof reorderTasksBodySchema>;
