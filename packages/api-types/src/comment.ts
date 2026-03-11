import {z} from "zod";

import {uuidv4Schema} from "./common.js";

export const commentSchema = z.object({
	id: uuidv4Schema,
	taskId: uuidv4Schema,
	userId: uuidv4Schema,
	content: z.string().min(1, "Content is required"),
	parentId: uuidv4Schema.nullable(),
	isEdited: z.boolean(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	user: z.object({
		id: uuidv4Schema,
		name: z.string(),
		image: z.string().nullable(),
	}).optional(),
});

export const createCommentBodySchema = z.object({
	content: z.string().min(1, "Content is required"),
	parentId: uuidv4Schema.optional(),
});

export const updateCommentBodySchema = z.object({
	content: z.string().min(1, "Content is required"),
});

export const commentResponseSchema = commentSchema;
export const commentListResponseSchema = z.array(commentSchema);

export type CommentItem = z.infer<typeof commentSchema>;
export type CreateCommentBody = z.infer<typeof createCommentBodySchema>;
export type UpdateCommentBody = z.infer<typeof updateCommentBodySchema>;
