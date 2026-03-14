import {
	db,
	eq,
	and,
	desc,
	asc,
	tasks,
	users,
	labels,
	taskLabels,
	taskDependencies,
	categories,
	boards,
	isNull,
} from "@pluteojs/database";

import logger from "@loaders/logger";

import {httpStatusCodes} from "@customTypes/networkTypes";
import type {
	iTask,
	iCreateTaskDTO,
	iUpdateTaskDTO,
	iMoveTaskDTO,
	iTaskDependency,
} from "@customTypes/appDataTypes/taskTypes";

import {ServiceError} from "@errors/ServiceError";
import {taskServiceError} from "@constants/errors/taskServiceErrors";

import AutoSortEngineService from "./AutoSortEngineService";

export default class TasksService {
	private autoSortEngine: AutoSortEngineService;

	constructor() {
		this.autoSortEngine = new AutoSortEngineService();
	}

	private safeISOString(date: Date | null | undefined): string | null {
		if (!date) {
			return null;
		}
		try {
			return date.toISOString();
		} catch {
			return null;
		}
	}

	private toDTO(
		record: typeof tasks.$inferSelect,
		extra?: {
			labels?: {
				id: string;
				projectId: string;
				name: string;
				color: string;
				createdAt: Date;
			}[];
			assignee?: {id: string; name: string; image: string | null} | null;
			createdByUser?: {id: string; name: string; image: string | null};
		}
	): iTask {
		return {
			id: record.id,
			projectId: record.projectId,
			categoryId: record.categoryId,
			createdById: record.createdById,
			assigneeId: record.assigneeId,
			title: record.title,
			description: record.description,
			priority: record.priority,
			status: record.status,
			sortOrder: record.sortOrder,
			dueAt: this.safeISOString(record.dueAt),
			startAt: this.safeISOString(record.startAt),
			estimatedMinutes: record.estimatedMinutes,
			effortLevel: record.effortLevel ?? null,
			coverImage: record.coverImage,
			isArchived: record.isArchived,
			completedAt: this.safeISOString(record.completedAt),
			createdAt: record.createdAt.toISOString(),
			updatedAt: record.updatedAt.toISOString(),
			labels: extra?.labels?.map((l) => {
				return {
					id: l.id,
					projectId: l.projectId,
					name: l.name,
					color: l.color,
					createdAt: l.createdAt.toISOString(),
				};
			}),
			assignee: extra?.assignee ?? undefined,
			createdByUser: extra?.createdByUser,
		};
	}

	public async createTask(
		userId: string,
		projectId: string,
		input: iCreateTaskDTO
	): Promise<iTask> {
		logger.silly("Creating a new task");

		const result = await db
			.insert(tasks)
			.values({
				projectId,
				createdById: userId,
				title: input.title,
				description: input.description ?? null,
				categoryId: input.categoryId ?? null,
				assigneeId: input.assigneeId ?? null,
				priority: input.priority ?? "medium",
				status: input.status ?? "open",
				dueAt: input.dueAt ? new Date(input.dueAt) : null,
				startAt: input.startAt ? new Date(input.startAt) : null,
				estimatedMinutes: input.estimatedMinutes ?? null,
				effortLevel: input.effortLevel ?? null,
				sortOrder: input.sortOrder ?? 0,
			})
			.returning();

		const record = result[0]!;
		logger.silly("Task created successfully");
		const task = this.toDTO(record);

		// Trigger auto-sort evaluation (fire-and-forget)
		this.autoSortEngine.evaluateTask(task, userId).catch((err) => {
			logger.error("Auto-sort evaluation failed after createTask", err as string);
		});

		return task;
	}

	public async getTasksByProject(projectId: string): Promise<iTask[]> {
		logger.silly("Retrieving tasks for project");

		const records = await db
			.select()
			.from(tasks)
			.where(and(eq(tasks.projectId, projectId), eq(tasks.isArchived, false)))
			.orderBy(asc(tasks.sortOrder));

		return records.map((r) => {
			return this.toDTO(r);
		});
	}

	public async getTasksByCategory(categoryId: string): Promise<iTask[]> {
		logger.silly("Retrieving tasks for category");

		const records = await db
			.select()
			.from(tasks)
			.where(and(eq(tasks.categoryId, categoryId), eq(tasks.isArchived, false)))
			.orderBy(asc(tasks.sortOrder));

		return records.map((r) => {
			return this.toDTO(r);
		});
	}

	public async getTask(taskId: string): Promise<iTask> {
		logger.silly("Retrieving task by id");

		const records = await db
			.select()
			.from(tasks)
			.where(eq(tasks.id, taskId))
			.limit(1);

		const record = records[0];
		if (!record) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				taskServiceError.getTask.TaskNotFound
			);
		}

		// Get labels for this task
		const taskLabelRecords = await db
			.select({
				id: labels.id,
				projectId: labels.projectId,
				name: labels.name,
				color: labels.color,
				createdAt: labels.createdAt,
			})
			.from(taskLabels)
			.innerJoin(labels, eq(taskLabels.labelId, labels.id))
			.where(eq(taskLabels.taskId, taskId));

		// Get assignee info
		let assignee: {id: string; name: string; image: string | null} | null =
			null;
		if (record.assigneeId) {
			const assigneeRecords = await db
				.select({id: users.id, name: users.name, image: users.image})
				.from(users)
				.where(eq(users.id, record.assigneeId))
				.limit(1);
			assignee = assigneeRecords[0] ?? null;
		}

		// Get creator info
		const creatorRecords = await db
			.select({id: users.id, name: users.name, image: users.image})
			.from(users)
			.where(eq(users.id, record.createdById))
			.limit(1);

		return this.toDTO(record, {
			labels: taskLabelRecords,
			assignee,
			createdByUser: creatorRecords[0],
		});
	}

	public async updateTask(
		taskId: string,
		input: iUpdateTaskDTO
	): Promise<iTask> {
		logger.silly("Updating task");

		const updateValues: Record<string, unknown> = {};
		if (input.title !== undefined) {
			updateValues.title = input.title;
		}
		if (input.description !== undefined) {
			updateValues.description = input.description;
		}
		if (input.categoryId !== undefined) {
			updateValues.categoryId = input.categoryId;
		}
		if (input.assigneeId !== undefined) {
			updateValues.assigneeId = input.assigneeId;
		}
		if (input.priority !== undefined) {
			updateValues.priority = input.priority;
		}
		if (input.status !== undefined) {
			updateValues.status = input.status;
			if (input.status === "done" || input.status === "closed") {
				updateValues.completedAt = new Date();
			} else {
				updateValues.completedAt = null;
			}

			// If categoryId wasn't explicitly provided, sync it to the matching
			// category on the project's default status board
			if (input.categoryId === undefined) {
				// First, get the task's projectId
				const taskRows = await db
					.select({projectId: tasks.projectId})
					.from(tasks)
					.where(eq(tasks.id, taskId))
					.limit(1);

				if (taskRows[0]) {
					const matchingCat = await db
						.select({categoryId: categories.id})
						.from(categories)
						.innerJoin(boards, eq(categories.boardId, boards.id))
						.where(
							and(
								eq(boards.projectId, taskRows[0].projectId),
								eq(boards.type, "status"),
								eq(boards.isDefault, true),
								eq(categories.statusValue, input.status)
							)
						)
						.limit(1);

					if (matchingCat[0]) {
						updateValues.categoryId = matchingCat[0].categoryId;
					}
				}
			}
		}
		if (input.dueAt !== undefined) {
			updateValues.dueAt = input.dueAt ? new Date(input.dueAt) : null;
		}
		if (input.startAt !== undefined) {
			updateValues.startAt = input.startAt ? new Date(input.startAt) : null;
		}
		if (input.estimatedMinutes !== undefined) {
			updateValues.estimatedMinutes = input.estimatedMinutes;
		}
		if (input.effortLevel !== undefined) {
			updateValues.effortLevel = input.effortLevel;
		}
		if (input.coverImage !== undefined) {
			updateValues.coverImage = input.coverImage;
		}
		if (input.isArchived !== undefined) {
			updateValues.isArchived = input.isArchived;
		}
		if (input.sortOrder !== undefined) {
			updateValues.sortOrder = input.sortOrder;
		}

		const result = await db
			.update(tasks)
			.set(updateValues)
			.where(eq(tasks.id, taskId))
			.returning();

		const record = result[0];
		if (!record) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				taskServiceError.updateTask.TaskNotFound
			);
		}

		logger.silly("Task updated successfully");
		const task = this.toDTO(record);

		// Trigger auto-sort evaluation (fire-and-forget)
		this.autoSortEngine.evaluateTask(task).catch((err) => {
			logger.error("Auto-sort evaluation failed after updateTask", err as string);
		});

		return task;
	}

	public async moveTask(taskId: string, input: iMoveTaskDTO): Promise<iTask> {
		logger.silly("Moving task");

		// Look up the target category's statusValue so we can keep status in sync
		const updateFields: Record<string, unknown> = {
			categoryId: input.categoryId,
			sortOrder: input.sortOrder,
		};

		if (input.categoryId) {
			const catRows = await db
				.select({statusValue: categories.statusValue})
				.from(categories)
				.where(eq(categories.id, input.categoryId))
				.limit(1);

			const statusValue = catRows[0]?.statusValue;
			if (statusValue) {
				updateFields.status = statusValue;
				if (statusValue === "done" || statusValue === "closed") {
					updateFields.completedAt = new Date();
				} else {
					updateFields.completedAt = null;
				}
			}
		}

		const result = await db
			.update(tasks)
			.set(updateFields)
			.where(eq(tasks.id, taskId))
			.returning();

		const record = result[0];
		if (!record) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				taskServiceError.moveTask.TaskNotFound
			);
		}

		logger.silly("Task moved successfully");
		const task = this.toDTO(record);

		// Trigger auto-sort evaluation (fire-and-forget)
		this.autoSortEngine.evaluateTask(task).catch((err) => {
			logger.error("Auto-sort evaluation failed after moveTask", err as string);
		});

		return task;
	}

	public async reorderTasks(
		items: {id: string; sortOrder: number}[]
	): Promise<void> {
		logger.silly("Reordering tasks");

		for (const item of items) {
			await db
				.update(tasks)
				.set({sortOrder: item.sortOrder})
				.where(eq(tasks.id, item.id));
		}

		logger.silly("Tasks reordered successfully");
	}

	public async deleteTask(taskId: string): Promise<void> {
		logger.silly("Deleting task");

		const result = await db
			.delete(tasks)
			.where(eq(tasks.id, taskId))
			.returning({id: tasks.id});

		if (result.length === 0) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				taskServiceError.deleteTask.TaskNotFound
			);
		}

		logger.silly("Task deleted successfully");
	}

	// ---- Task Dependencies ------------------------------------------------

	public async addDependency(
		dependentTaskId: string,
		dependsOnTaskId: string,
		dependencyType: string = "blocks"
	): Promise<iTaskDependency> {
		logger.silly("Adding task dependency");

		// Prevent self-dependency
		if (dependentTaskId === dependsOnTaskId) {
			throw new ServiceError(httpStatusCodes.CLIENT_ERROR_BAD_REQUEST, {
				error: "SelfDependency",
				message: "A task cannot depend on itself",
				details: null,
			});
		}

		// Check for circular dependency
		const wouldBeCyclic = await this.wouldCreateCycle(
			dependentTaskId,
			dependsOnTaskId
		);
		if (wouldBeCyclic) {
			throw new ServiceError(httpStatusCodes.CLIENT_ERROR_BAD_REQUEST, {
				error: "CircularDependency",
				message: "This would create a circular dependency",
				details: null,
			});
		}

		const result = await db
			.insert(taskDependencies)
			.values({dependentTaskId, dependsOnTaskId, dependencyType})
			.returning();

		const record = result[0]!;

		// Fetch the depends-on task info
		const depTask = await db
			.select({
				id: tasks.id,
				title: tasks.title,
				status: tasks.status,
				categoryId: tasks.categoryId,
			})
			.from(tasks)
			.where(eq(tasks.id, dependsOnTaskId))
			.limit(1);

		logger.silly("Task dependency added successfully");
		return {
			id: record.id,
			dependentTaskId: record.dependentTaskId,
			dependsOnTaskId: record.dependsOnTaskId,
			dependencyType: record.dependencyType,
			createdAt: record.createdAt.toISOString(),
			dependsOnTask: depTask[0] ?? undefined,
		};
	}

	public async removeDependency(dependencyId: string): Promise<void> {
		logger.silly("Removing task dependency");

		const result = await db
			.delete(taskDependencies)
			.where(eq(taskDependencies.id, dependencyId))
			.returning({id: taskDependencies.id});

		if (result.length === 0) {
			throw new ServiceError(httpStatusCodes.CLIENT_ERROR_NOT_FOUND, {
				error: "DependencyNotFound",
				message: "Dependency not found",
				details: null,
			});
		}

		logger.silly("Task dependency removed successfully");
	}

	public async getDependencies(taskId: string): Promise<{
		blockedBy: iTaskDependency[];
		blocking: iTaskDependency[];
	}> {
		logger.silly("Retrieving task dependencies");

		// Tasks that block this task (this task depends on them)
		const blockedByRaw = await db
			.select({
				id: taskDependencies.id,
				dependentTaskId: taskDependencies.dependentTaskId,
				dependsOnTaskId: taskDependencies.dependsOnTaskId,
				dependencyType: taskDependencies.dependencyType,
				createdAt: taskDependencies.createdAt,
				taskId: tasks.id,
				taskTitle: tasks.title,
				taskStatus: tasks.status,
				taskCategoryId: tasks.categoryId,
			})
			.from(taskDependencies)
			.innerJoin(tasks, eq(taskDependencies.dependsOnTaskId, tasks.id))
			.where(eq(taskDependencies.dependentTaskId, taskId));

		// Tasks blocked by this task (they depend on this task)
		const blockingRaw = await db
			.select({
				id: taskDependencies.id,
				dependentTaskId: taskDependencies.dependentTaskId,
				dependsOnTaskId: taskDependencies.dependsOnTaskId,
				dependencyType: taskDependencies.dependencyType,
				createdAt: taskDependencies.createdAt,
				taskId: tasks.id,
				taskTitle: tasks.title,
				taskStatus: tasks.status,
				taskCategoryId: tasks.categoryId,
			})
			.from(taskDependencies)
			.innerJoin(tasks, eq(taskDependencies.dependentTaskId, tasks.id))
			.where(eq(taskDependencies.dependsOnTaskId, taskId));

		return {
			blockedBy: blockedByRaw.map((r) => {
				return {
					id: r.id,
					dependentTaskId: r.dependentTaskId,
					dependsOnTaskId: r.dependsOnTaskId,
					dependencyType: r.dependencyType,
					createdAt: r.createdAt.toISOString(),
					dependsOnTask: {
						id: r.taskId,
						title: r.taskTitle,
						status: r.taskStatus,
						categoryId: r.taskCategoryId,
					},
				};
			}),
			blocking: blockingRaw.map((r) => {
				return {
					id: r.id,
					dependentTaskId: r.dependentTaskId,
					dependsOnTaskId: r.dependsOnTaskId,
					dependencyType: r.dependencyType,
					createdAt: r.createdAt.toISOString(),
					dependentTask: {
						id: r.taskId,
						title: r.taskTitle,
						status: r.taskStatus,
						categoryId: r.taskCategoryId,
					},
				};
			}),
		};
	}

	/**
	 * Check if adding dependentTaskId -> dependsOnTaskId would create a cycle.
	 * We check if dependsOnTaskId already (transitively) depends on dependentTaskId.
	 */
	private async wouldCreateCycle(
		dependentTaskId: string,
		dependsOnTaskId: string
	): Promise<boolean> {
		const visited = new Set<string>();
		const queue = [dependentTaskId];

		while (queue.length > 0) {
			const current = queue.shift()!;
			if (current === dependsOnTaskId) {
				continue;
			} // skip the direct edge we're adding
			if (visited.has(current)) {
				continue;
			}
			visited.add(current);

			// Find all tasks that depend on `current` (i.e., current blocks them)
			const blocked = await db
				.select({dependentTaskId: taskDependencies.dependentTaskId})
				.from(taskDependencies)
				.where(eq(taskDependencies.dependsOnTaskId, current));

			for (const b of blocked) {
				if (b.dependentTaskId === dependsOnTaskId) {
					return true;
				}
				queue.push(b.dependentTaskId);
			}
		}

		return false;
	}
}
