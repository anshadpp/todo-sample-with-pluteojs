import {z} from "zod";

import {uuidv4Schema} from "./common.js";

export const categorySchema = z.object({
	id: uuidv4Schema,
	boardId: uuidv4Schema,
	name: z.string().min(1, "Name is required"),
	color: z.string().nullable(),
	statusValue: z.string().nullable(),
	sortOrder: z.number(),
	wipLimit: z.number().nullable(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const createCategoryBodySchema = z.object({
	name: z.string().min(1, "Name is required"),
	color: z.string().optional(),
	statusValue: z.string().optional(),
	wipLimit: z.number().positive().optional(),
});

export const updateCategoryBodySchema = z.object({
	name: z.string().min(1).optional(),
	color: z.string().nullable().optional(),
	statusValue: z.string().nullable().optional(),
	sortOrder: z.number().optional(),
	wipLimit: z.number().positive().nullable().optional(),
});

export const reorderCategoriesBodySchema = z.object({
	categories: z.array(
		z.object({
			id: uuidv4Schema,
			sortOrder: z.number(),
		})
	),
});

export const categoryResponseSchema = categorySchema;
export const categoryListResponseSchema = z.array(categorySchema);

export type CategoryItem = z.infer<typeof categorySchema>;
export type CreateCategoryBody = z.infer<typeof createCategoryBodySchema>;
export type UpdateCategoryBody = z.infer<typeof updateCategoryBodySchema>;
export type ReorderCategoriesBody = z.infer<typeof reorderCategoriesBodySchema>;
