import {db, eq, and, asc, taskContents, users} from "@pluteojs/database";

import logger from "@loaders/logger";

import {httpStatusCodes} from "@customTypes/networkTypes";
import type {iTaskContent, iCreateTaskContentDTO, iUpdateTaskContentDTO} from "@customTypes/appDataTypes/taskTypes";

import {ServiceError} from "@errors/ServiceError";
import {taskServiceError} from "@constants/errors/taskServiceErrors";

export default class TaskContentsService {
	private toDTO(
		record: typeof taskContents.$inferSelect,
		user?: {id: string; name: string; image: string | null},
	): iTaskContent {
		return {
			id: record.id,
			taskId: record.taskId,
			createdById: record.createdById,
			type: record.type,
			title: record.title,
			content: record.content,
			language: record.language,
			url: record.url,
			sortOrder: record.sortOrder,
			createdAt: record.createdAt.toISOString(),
			updatedAt: record.updatedAt.toISOString(),
			user,
		};
	}

	public async getContents(taskId: string): Promise<iTaskContent[]> {
		logger.silly("Retrieving contents for task");

		const records = await db
			.select({
				content: taskContents,
				user: {
					id: users.id,
					name: users.name,
					image: users.image,
				},
			})
			.from(taskContents)
			.innerJoin(users, eq(taskContents.createdById, users.id))
			.where(eq(taskContents.taskId, taskId))
			.orderBy(asc(taskContents.sortOrder), asc(taskContents.createdAt));

		return records.map((r) => {return this.toDTO(r.content, r.user);});
	}

	public async createContent(
		userId: string,
		taskId: string,
		input: iCreateTaskContentDTO,
	): Promise<iTaskContent> {
		logger.silly("Creating task content");

		const result = await db
			.insert(taskContents)
			.values({
				taskId,
				createdById: userId,
				type: input.type,
				title: input.title ?? null,
				content: input.content,
				language: input.language ?? null,
				url: input.url ?? null,
				sortOrder: input.sortOrder ?? 0,
			})
			.returning();

		const record = result[0]!;

		const userRecords = await db
			.select({id: users.id, name: users.name, image: users.image})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		logger.silly("Task content created successfully");
		return this.toDTO(record, userRecords[0]);
	}

	public async updateContent(
		userId: string,
		contentId: string,
		input: iUpdateTaskContentDTO,
	): Promise<iTaskContent> {
		logger.silly("Updating task content");

		const existing = await db
			.select()
			.from(taskContents)
			.where(eq(taskContents.id, contentId))
			.limit(1);

		if (!existing[0]) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				taskServiceError.updateTaskContent.ContentNotFound,
			);
		}

		if (existing[0].createdById !== userId) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_FORBIDDEN,
				taskServiceError.updateTaskContent.NotContentOwner,
			);
		}

		const updateValues: Record<string, unknown> = {};
		if (input.title !== undefined) {updateValues.title = input.title;}
		if (input.content !== undefined) {updateValues.content = input.content;}
		if (input.language !== undefined) {updateValues.language = input.language;}
		if (input.url !== undefined) {updateValues.url = input.url;}
		if (input.sortOrder !== undefined) {updateValues.sortOrder = input.sortOrder;}

		const result = await db
			.update(taskContents)
			.set(updateValues)
			.where(eq(taskContents.id, contentId))
			.returning();

		const record = result[0]!;

		const userRecords = await db
			.select({id: users.id, name: users.name, image: users.image})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		logger.silly("Task content updated successfully");
		return this.toDTO(record, userRecords[0]);
	}

	public async deleteContent(userId: string, contentId: string): Promise<void> {
		logger.silly("Deleting task content");

		const existing = await db
			.select()
			.from(taskContents)
			.where(eq(taskContents.id, contentId))
			.limit(1);

		if (!existing[0]) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				taskServiceError.deleteTaskContent.ContentNotFound,
			);
		}

		if (existing[0].createdById !== userId) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_FORBIDDEN,
				taskServiceError.deleteTaskContent.NotContentOwner,
			);
		}

		await db.delete(taskContents).where(eq(taskContents.id, contentId));
		logger.silly("Task content deleted successfully");
	}
}
