import {db, eq, taskActivities, users} from "@pluteojs/database";

import logger from "@loaders/logger";

import type {iActivity} from "@customTypes/appDataTypes/taskTypes";

export default class ActivityService {
	private toDTO(record: typeof taskActivities.$inferSelect, user?: {id: string; name: string; image: string | null}): iActivity {
		return {
			id: record.id,
			taskId: record.taskId,
			userId: record.userId,
			action: record.action,
			field: record.field,
			oldValue: record.oldValue,
			newValue: record.newValue,
			metadata: record.metadata,
			createdAt: record.createdAt.toISOString(),
			user,
		};
	}

	public async logActivity(
		taskId: string,
		userId: string,
		action: string,
		field?: string,
		oldValue?: string,
		newValue?: string,
		metadata?: string,
	): Promise<void> {
		await db.insert(taskActivities).values({
			taskId,
			userId,
			action,
			field: field ?? null,
			oldValue: oldValue ?? null,
			newValue: newValue ?? null,
			metadata: metadata ?? null,
		});

		logger.silly(`Activity logged: ${action} on task ${taskId}`);
	}

	public async getActivities(taskId: string): Promise<iActivity[]> {
		logger.silly("Retrieving activities for task");

		const records = await db
			.select({
				activity: taskActivities,
				user: {
					id: users.id,
					name: users.name,
					image: users.image,
				},
			})
			.from(taskActivities)
			.innerJoin(users, eq(taskActivities.userId, users.id))
			.where(eq(taskActivities.taskId, taskId))
			.orderBy(taskActivities.createdAt);

		return records.map((r) => {return this.toDTO(r.activity, r.user);});
	}
}
