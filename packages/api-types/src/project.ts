import {z} from "zod";

import {uuidv4Schema} from "./common.js";

export const projectSchema = z.object({
	id: uuidv4Schema,
	name: z.string().min(1, "Name is required"),
	description: z.string().nullable(),
	slug: z.string(),
	organizationId: uuidv4Schema,
	createdById: uuidv4Schema,
	color: z.string().nullable(),
	icon: z.string().nullable(),
	isArchived: z.boolean(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const createProjectBodySchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	color: z.string().optional(),
	icon: z.string().optional(),
});

export const updateProjectBodySchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	icon: z.string().nullable().optional(),
	isArchived: z.boolean().optional(),
});

export const projectResponseSchema = projectSchema;
export const projectListResponseSchema = z.array(projectSchema);

export type ProjectItem = z.infer<typeof projectSchema>;
export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;
export type UpdateProjectBody = z.infer<typeof updateProjectBodySchema>;
