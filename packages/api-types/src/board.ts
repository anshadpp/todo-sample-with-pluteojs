import {z} from "zod";

import {uuidv4Schema} from "./common.js";

export const boardSchema = z.object({
	id: uuidv4Schema,
	projectId: uuidv4Schema,
	name: z.string().min(1, "Name is required"),
	description: z.string().nullable(),
	isDefault: z.boolean(),
	sortOrder: z.number(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const createBoardBodySchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
});

export const updateBoardBodySchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().nullable().optional(),
});

export const boardResponseSchema = boardSchema;
export const boardListResponseSchema = z.array(boardSchema);

export type BoardItem = z.infer<typeof boardSchema>;
export type CreateBoardBody = z.infer<typeof createBoardBodySchema>;
export type UpdateBoardBody = z.infer<typeof updateBoardBodySchema>;
