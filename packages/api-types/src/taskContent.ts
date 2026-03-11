import {z} from "zod";

import {uuidv4Schema} from "./common.js";

export const taskContentTypeEnum = z.enum(["code", "doc", "link", "note"]);

export const taskContentSchema = z.object({
	id: uuidv4Schema,
	taskId: uuidv4Schema,
	createdById: uuidv4Schema,
	type: taskContentTypeEnum,
	title: z.string().nullable(),
	content: z.string().min(1, "Content is required"),
	language: z.string().nullable(),
	url: z.string().nullable(),
	sortOrder: z.number(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	user: z.object({
		id: uuidv4Schema,
		name: z.string(),
		image: z.string().nullable(),
	}).optional(),
});

export const createTaskContentBodySchema = z.object({
	type: taskContentTypeEnum,
	title: z.string().optional(),
	content: z.string().min(1, "Content is required"),
	language: z.string().optional(),
	url: z.string().url("Must be a valid URL").optional(),
	sortOrder: z.number().optional(),
});

export const updateTaskContentBodySchema = z.object({
	title: z.string().nullable().optional(),
	content: z.string().min(1).optional(),
	language: z.string().nullable().optional(),
	url: z.string().url("Must be a valid URL").nullable().optional(),
	sortOrder: z.number().optional(),
});

export const taskContentResponseSchema = taskContentSchema;
export const taskContentListResponseSchema = z.array(taskContentSchema);

export type TaskContentItem = z.infer<typeof taskContentSchema>;
export type CreateTaskContentBody = z.infer<typeof createTaskContentBodySchema>;
export type UpdateTaskContentBody = z.infer<typeof updateTaskContentBodySchema>;
