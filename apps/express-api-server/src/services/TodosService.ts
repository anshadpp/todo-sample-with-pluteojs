import {db, eq, and, todos, lt, lte} from "@pluteojs/database";

import logger from "@loaders/logger";

import {httpStatusCodes} from "@customTypes/networkTypes";
import type {iTodo, iCreateTodoDTO, iUpdateTodoDTO} from "@customTypes/appDataTypes/todoTypes";

import {ServiceError} from "@errors/ServiceError";
import {todosServiceError} from "@constants/errors/todosServiceErrors";

export default class TodosService {
	private toDTO(record: typeof todos.$inferSelect): iTodo {
		return {
			id: record.id,
			userId: record.userId,
			title: record.title,
			description: record.description,
			completed: record.completed,
			dueAt: record.dueAt?.toISOString() ?? null,
			notifyAt: record.notifyAt?.toISOString() ?? null,
			notified: record.notified,
			createdAt: record.createdAt.toISOString(),
			updatedAt: record.updatedAt.toISOString(),
		};
	}

	public async createTodo(userId: string, input: iCreateTodoDTO): Promise<iTodo> {
		logger.silly("Creating a new todo");

		const result = await db
			.insert(todos)
			.values({
				userId,
				title: input.title,
				description: input.description ?? null,
				dueAt: input.dueAt ? new Date(input.dueAt) : null,
				notifyAt: input.notifyAt ? new Date(input.notifyAt) : null,
			})
			.returning();

		const record = result[0]!;
		logger.silly("Todo created successfully");
		return this.toDTO(record);
	}

	public async getTodos(userId: string): Promise<iTodo[]> {
		logger.silly("Retrieving all todos for user");

		const records = await db
			.select()
			.from(todos)
			.where(eq(todos.userId, userId))
			.orderBy(todos.createdAt);

		return records.map((r) => {return this.toDTO(r);});
	}

	public async getTodo(userId: string, todoId: string): Promise<iTodo> {
		logger.silly("Retrieving todo by id");

		const records = await db
			.select()
			.from(todos)
			.where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
			.limit(1);

		const record = records[0];

		if (!record) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				todosServiceError.getTodo.TodoNotFound,
			);
		}

		return this.toDTO(record);
	}

	public async updateTodo(userId: string, todoId: string, input: iUpdateTodoDTO): Promise<iTodo> {
		logger.silly("Updating todo");

		const updateValues: Record<string, unknown> = {};

		if (input.title !== undefined) {updateValues.title = input.title;}
		if (input.description !== undefined) {updateValues.description = input.description;}
		if (input.completed !== undefined) {updateValues.completed = input.completed;}
		if (input.dueAt !== undefined) {updateValues.dueAt = input.dueAt ? new Date(input.dueAt) : null;}
		if (input.notifyAt !== undefined) {
			updateValues.notifyAt = input.notifyAt ? new Date(input.notifyAt) : null;
			updateValues.notified = false;
		}

		const result = await db
			.update(todos)
			.set(updateValues)
			.where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
			.returning();

		const record = result[0];

		if (!record) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				todosServiceError.updateTodo.TodoNotFound,
			);
		}

		logger.silly("Todo updated successfully");
		return this.toDTO(record);
	}

	public async deleteTodo(userId: string, todoId: string): Promise<void> {
		logger.silly("Deleting todo");

		const result = await db
			.delete(todos)
			.where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
			.returning({id: todos.id});

		if (result.length === 0) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				todosServiceError.deleteTodo.TodoNotFound,
			);
		}

		logger.silly("Todo deleted successfully");
	}

	public async getDueTodos(): Promise<iTodo[]> {
		logger.silly("Retrieving todos due for notification");

		const now = new Date();

		const records = await db
			.select()
			.from(todos)
			.where(
				and(
					eq(todos.notified, false),
					eq(todos.completed, false),
					lte(todos.notifyAt, now),
				),
			);

		return records.map((r) => {return this.toDTO(r);});
	}

	public async markAsNotified(todoIds: string[]): Promise<void> {
		if (todoIds.length === 0) {return;}

		for (const id of todoIds) {
			await db
				.update(todos)
				.set({notified: true})
				.where(eq(todos.id, id));
		}

		logger.silly(`Marked ${todoIds.length} todos as notified`);
	}
}
