import {z} from "zod";

import {uuidv4Schema} from "./common.js";

/**
 * Todo-related validation schemas.
 */

export const todoIdSchema = uuidv4Schema;

export const todoSchema = z.object({
	id: todoIdSchema,
	userId: uuidv4Schema,
	title: z.string().min(1, "Title is required"),
	description: z.string().nullable(),
	completed: z.boolean(),
	dueAt: z.string().datetime().nullable(),
	notifyAt: z.string().datetime().nullable(),
	notified: z.boolean(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const createTodoBodySchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	dueAt: z.string().datetime().optional(),
	notifyAt: z.string().datetime().optional(),
});

export const updateTodoBodySchema = z.object({
	title: z.string().min(1, "Title is required").optional(),
	description: z.string().nullable().optional(),
	completed: z.boolean().optional(),
	dueAt: z.string().datetime().nullable().optional(),
	notifyAt: z.string().datetime().nullable().optional(),
});

export const todoResponseSchema = todoSchema;

export const todoListResponseSchema = z.array(todoSchema);

/**
 * Inferred types from schemas
 */
export type TodoId = z.infer<typeof todoIdSchema>;
export type TodoItem = z.infer<typeof todoSchema>;
export type CreateTodoBody = z.infer<typeof createTodoBodySchema>;
export type UpdateTodoBody = z.infer<typeof updateTodoBodySchema>;
export type TodoResponse = z.infer<typeof todoResponseSchema>;
