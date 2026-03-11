import {z} from "zod";

import {uuidv4Schema} from "./common.js";

export const notificationSchema = z.object({
	id: uuidv4Schema,
	userId: uuidv4Schema,
	type: z.string(),
	title: z.string(),
	body: z.string().nullable(),
	resourceType: z.string().nullable(),
	resourceId: uuidv4Schema.nullable(),
	isRead: z.boolean(),
	readAt: z.string().datetime().nullable(),
	createdAt: z.string().datetime(),
});

export const notificationListResponseSchema = z.array(notificationSchema);

export const unreadCountResponseSchema = z.object({
	count: z.number(),
});

export type NotificationItem = z.infer<typeof notificationSchema>;
export type UnreadCountResponse = z.infer<typeof unreadCountResponseSchema>;
