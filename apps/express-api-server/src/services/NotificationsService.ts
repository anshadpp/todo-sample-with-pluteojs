import {db, eq, and, desc, notifications} from "@pluteojs/database";

import logger from "@loaders/logger";

import type {iNotification} from "@customTypes/appDataTypes/taskTypes";

export default class NotificationsService {
	private toDTO(record: typeof notifications.$inferSelect): iNotification {
		return {
			id: record.id,
			userId: record.userId,
			type: record.type,
			title: record.title,
			body: record.body,
			resourceType: record.resourceType,
			resourceId: record.resourceId,
			isRead: record.isRead,
			readAt: record.readAt?.toISOString() ?? null,
			createdAt: record.createdAt.toISOString(),
		};
	}

	public async createNotification(
		userId: string,
		type: string,
		title: string,
		body?: string,
		resourceType?: string,
		resourceId?: string
	): Promise<iNotification> {
		const result = await db
			.insert(notifications)
			.values({
				userId,
				type,
				title,
				body: body ?? null,
				resourceType: resourceType ?? null,
				resourceId: resourceId ?? null,
			})
			.returning();

		return this.toDTO(result[0]!);
	}

	public async getNotifications(
		userId: string,
		limit = 50
	): Promise<iNotification[]> {
		logger.silly("Retrieving notifications for user");

		const records = await db
			.select()
			.from(notifications)
			.where(eq(notifications.userId, userId))
			.orderBy(desc(notifications.createdAt))
			.limit(limit);

		return records.map((r) => {
			return this.toDTO(r);
		});
	}

	public async getUnreadCount(userId: string): Promise<number> {
		const records = await db
			.select()
			.from(notifications)
			.where(
				and(eq(notifications.userId, userId), eq(notifications.isRead, false))
			);

		return records.length;
	}

	public async markAsRead(
		notificationId: string,
		userId: string
	): Promise<void> {
		await db
			.update(notifications)
			.set({isRead: true, readAt: new Date()})
			.where(
				and(
					eq(notifications.id, notificationId),
					eq(notifications.userId, userId)
				)
			);
	}

	public async markAllAsRead(userId: string): Promise<void> {
		await db
			.update(notifications)
			.set({isRead: true, readAt: new Date()})
			.where(
				and(eq(notifications.userId, userId), eq(notifications.isRead, false))
			);
	}
}
