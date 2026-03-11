import {z} from "zod";

import {uuidv4Schema} from "./common.js";

export const activitySchema = z.object({
	id: uuidv4Schema,
	taskId: uuidv4Schema,
	userId: uuidv4Schema,
	action: z.string(),
	field: z.string().nullable(),
	oldValue: z.string().nullable(),
	newValue: z.string().nullable(),
	metadata: z.string().nullable(),
	createdAt: z.string().datetime(),
	user: z.object({
		id: uuidv4Schema,
		name: z.string(),
		image: z.string().nullable(),
	}).optional(),
});

export const activityListResponseSchema = z.array(activitySchema);

export type ActivityItem = z.infer<typeof activitySchema>;
