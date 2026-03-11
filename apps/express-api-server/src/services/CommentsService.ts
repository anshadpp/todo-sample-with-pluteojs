import {db, eq, and, desc, taskComments, users} from "@pluteojs/database";

import logger from "@loaders/logger";

import {httpStatusCodes} from "@customTypes/networkTypes";
import type {iComment, iCreateCommentDTO, iUpdateCommentDTO} from "@customTypes/appDataTypes/taskTypes";

import {ServiceError} from "@errors/ServiceError";
import {taskServiceError} from "@constants/errors/taskServiceErrors";

export default class CommentsService {
	private toDTO(record: typeof taskComments.$inferSelect, user?: {id: string; name: string; image: string | null}): iComment {
		return {
			id: record.id,
			taskId: record.taskId,
			userId: record.userId,
			content: record.content,
			parentId: record.parentId,
			isEdited: record.isEdited,
			createdAt: record.createdAt.toISOString(),
			updatedAt: record.updatedAt.toISOString(),
			user,
		};
	}

	public async getComments(taskId: string): Promise<iComment[]> {
		logger.silly("Retrieving comments for task");

		const records = await db
			.select({
				comment: taskComments,
				user: {
					id: users.id,
					name: users.name,
					image: users.image,
				},
			})
			.from(taskComments)
			.innerJoin(users, eq(taskComments.userId, users.id))
			.where(eq(taskComments.taskId, taskId))
			.orderBy(taskComments.createdAt);

		return records.map((r) => {return this.toDTO(r.comment, r.user);});
	}

	public async createComment(userId: string, taskId: string, input: iCreateCommentDTO): Promise<iComment> {
		logger.silly("Creating a new comment");

		const result = await db
			.insert(taskComments)
			.values({
				taskId,
				userId,
				content: input.content,
				parentId: input.parentId ?? null,
			})
			.returning();

		const comment = result[0]!;

		// Get user info
		const userRecords = await db
			.select({id: users.id, name: users.name, image: users.image})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		logger.silly("Comment created successfully");
		return this.toDTO(comment, userRecords[0]);
	}

	public async updateComment(userId: string, commentId: string, input: iUpdateCommentDTO): Promise<iComment> {
		logger.silly("Updating comment");

		// Verify ownership
		const existing = await db
			.select()
			.from(taskComments)
			.where(eq(taskComments.id, commentId))
			.limit(1);

		if (!existing[0]) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				taskServiceError.updateComment.CommentNotFound,
			);
		}

		if (existing[0].userId !== userId) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_FORBIDDEN,
				taskServiceError.updateComment.NotCommentOwner,
			);
		}

		const result = await db
			.update(taskComments)
			.set({content: input.content, isEdited: true})
			.where(eq(taskComments.id, commentId))
			.returning();

		const comment = result[0]!;

		const userRecords = await db
			.select({id: users.id, name: users.name, image: users.image})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		logger.silly("Comment updated successfully");
		return this.toDTO(comment, userRecords[0]);
	}

	public async deleteComment(userId: string, commentId: string): Promise<void> {
		logger.silly("Deleting comment");

		const existing = await db
			.select()
			.from(taskComments)
			.where(eq(taskComments.id, commentId))
			.limit(1);

		if (!existing[0]) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				taskServiceError.deleteComment.CommentNotFound,
			);
		}

		if (existing[0].userId !== userId) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_FORBIDDEN,
				taskServiceError.deleteComment.NotCommentOwner,
			);
		}

		await db.delete(taskComments).where(eq(taskComments.id, commentId));
		logger.silly("Comment deleted successfully");
	}
}
