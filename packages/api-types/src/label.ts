import {z} from "zod";

import {uuidv4Schema} from "./common.js";

export const labelSchema = z.object({
	id: uuidv4Schema,
	projectId: uuidv4Schema,
	name: z.string().min(1, "Name is required"),
	color: z.string().min(1, "Color is required"),
	createdAt: z.string().datetime(),
});

export const createLabelBodySchema = z.object({
	name: z.string().min(1, "Name is required"),
	color: z.string().min(1, "Color is required"),
});

export const updateLabelBodySchema = z.object({
	name: z.string().min(1).optional(),
	color: z.string().min(1).optional(),
});

export const labelResponseSchema = labelSchema;
export const labelListResponseSchema = z.array(labelSchema);

export type LabelItem = z.infer<typeof labelSchema>;
export type CreateLabelBody = z.infer<typeof createLabelBodySchema>;
export type UpdateLabelBody = z.infer<typeof updateLabelBodySchema>;
