import {db, eq, and, tasks, categories, boards} from "@pluteojs/database";

import logger from "@loaders/logger";

import type {iTask, iAutoSortRule} from "@customTypes/appDataTypes/taskTypes";

import AutoSortRulesService from "./AutoSortRulesService";
import ActivityService from "./ActivityService";

interface AutoSortAction {
	ruleName: string;
	field: string;
	oldValue: string | null;
	newValue: string;
}

export default class AutoSortEngineService {
	private rulesService: AutoSortRulesService;
	private activityService: ActivityService;

	constructor() {
		this.rulesService = new AutoSortRulesService();
		this.activityService = new ActivityService();
	}

	/**
	 * Evaluate a single task against all enabled rules for its project.
	 * Called after task create/update/move.
	 */
	public async evaluateTask(
		task: iTask,
		triggeredByUserId?: string
	): Promise<AutoSortAction[]> {
		const rules = await this.rulesService.getEnabledRulesByProject(
			task.projectId
		);
		return this.applyRules(task, rules, triggeredByUserId);
	}

	/**
	 * Evaluate all non-archived tasks for a project against its rules.
	 * Called by the scheduled service for time-based rules.
	 */
	public async evaluateAllTasksForProject(
		projectId: string
	): Promise<number> {
		const rules = await this.rulesService.getEnabledRulesByProject(projectId);
		if (rules.length === 0) {return 0;}

		// Only process time-based rules in scheduled evaluation
		const timeBasedRules = rules.filter(
			(r) =>
			{return r.conditionOperator === "lt_now" ||
				r.conditionOperator === "gt_now";}
		);
		if (timeBasedRules.length === 0) {return 0;}

		const taskRecords = await db
			.select()
			.from(tasks)
			.where(and(eq(tasks.projectId, projectId), eq(tasks.isArchived, false)));

		let totalActions = 0;
		for (const record of taskRecords) {
			const task = this.recordToTask(record);
			const actions = await this.applyRules(task, timeBasedRules);
			totalActions += actions.length;
		}

		return totalActions;
	}

	private async applyRules(
		task: iTask,
		rules: iAutoSortRule[],
		triggeredByUserId?: string
	): Promise<AutoSortAction[]> {
		const actions: AutoSortAction[] = [];

		for (const rule of rules) {
			const matches = this.evaluateCondition(
				task,
				rule.conditionField,
				rule.conditionOperator,
				rule.conditionValue
			);

			if (!matches) {continue;}

			const action = await this.executeAction(task, rule);
			if (action) {
				actions.push(action);

				// Log activity
				await this.activityService.logActivity(
					task.id,
					triggeredByUserId ?? task.createdById,
					"auto_sorted",
					action.field,
					action.oldValue ?? undefined,
					action.newValue,
					JSON.stringify({ruleId: rule.id, ruleName: rule.name})
				);
			}

			if (rule.stopOnMatch) {break;}
		}

		return actions;
	}

	private evaluateCondition(
		task: iTask,
		field: string,
		operator: string,
		value: string | null
	): boolean {
		const taskValue = this.getTaskFieldValue(task, field);

		switch (operator) {
			case "eq":
				return taskValue === value;
			case "neq":
				return taskValue !== value;
			case "lt_now": {
				if (!taskValue) {return false;}
				return new Date(taskValue) < new Date();
			}
			case "gt_now": {
				if (!taskValue) {return false;}
				return new Date(taskValue) > new Date();
			}
			case "is_null":
				return taskValue === null || taskValue === undefined;
			case "is_not_null":
				return taskValue !== null && taskValue !== undefined;
			default:
				return false;
		}
	}

	private getTaskFieldValue(
		task: iTask,
		field: string
	): string | null | undefined {
		switch (field) {
			case "dueAt":
				return task.dueAt;
			case "status":
				return task.status;
			case "priority":
				return task.priority;
			case "completedAt":
				return task.completedAt;
			case "isArchived":
				return String(task.isArchived);
			case "assigneeId":
				return task.assigneeId;
			case "effortLevel":
				return task.effortLevel;
			default:
				return undefined;
		}
	}

	private async executeAction(
		task: iTask,
		rule: iAutoSortRule
	): Promise<AutoSortAction | null> {
		switch (rule.actionType) {
			case "move_to_category":
				return this.executeMoveToCategory(task, rule);
			case "set_status":
				return this.executeSetStatus(task, rule);
			case "set_priority":
				return this.executeSetPriority(task, rule);
			case "archive":
				return this.executeArchive(task, rule);
			default:
				return null;
		}
	}

	private async executeMoveToCategory(
		task: iTask,
		rule: iAutoSortRule
	): Promise<AutoSortAction | null> {
		// Skip if already in target category
		if (task.categoryId === rule.actionValue) {return null;}

		await db
			.update(tasks)
			.set({categoryId: rule.actionValue})
			.where(eq(tasks.id, task.id));

		// Also sync status if the target category has a statusValue
		const categoryRecords = await db
			.select()
			.from(categories)
			.where(eq(categories.id, rule.actionValue))
			.limit(1);

		const category = categoryRecords[0];
		if (category?.statusValue) {
			await db
				.update(tasks)
				.set({
					status: category.statusValue,
					completedAt:
						category.statusValue === "done" ||
						category.statusValue === "closed"
							? new Date()
							: null,
				})
				.where(eq(tasks.id, task.id));
		}

		return {
			ruleName: rule.name,
			field: "categoryId",
			oldValue: task.categoryId,
			newValue: rule.actionValue,
		};
	}

	private async executeSetStatus(
		task: iTask,
		rule: iAutoSortRule
	): Promise<AutoSortAction | null> {
		// Skip if already at target status
		if (task.status === rule.actionValue) {return null;}

		const updateValues: Record<string, unknown> = {
			status: rule.actionValue,
		};

		if (
			rule.actionValue === "done" ||
			rule.actionValue === "closed"
		) {
			updateValues.completedAt = new Date();
		} else {
			updateValues.completedAt = null;
		}

		await db
			.update(tasks)
			.set(updateValues)
			.where(eq(tasks.id, task.id));

		// Sync categoryId: find matching category on the project's default status board
		await this.syncCategoryFromStatus(task, rule.actionValue);

		return {
			ruleName: rule.name,
			field: "status",
			oldValue: task.status,
			newValue: rule.actionValue,
		};
	}

	private async executeSetPriority(
		task: iTask,
		rule: iAutoSortRule
	): Promise<AutoSortAction | null> {
		if (task.priority === rule.actionValue) {return null;}

		await db
			.update(tasks)
			.set({priority: rule.actionValue})
			.where(eq(tasks.id, task.id));

		return {
			ruleName: rule.name,
			field: "priority",
			oldValue: task.priority,
			newValue: rule.actionValue,
		};
	}

	private async executeArchive(
		task: iTask,
		rule: iAutoSortRule
	): Promise<AutoSortAction | null> {
		if (task.isArchived) {return null;}

		await db
			.update(tasks)
			.set({isArchived: true})
			.where(eq(tasks.id, task.id));

		return {
			ruleName: rule.name,
			field: "isArchived",
			oldValue: "false",
			newValue: "true",
		};
	}

	/**
	 * When status changes, find the matching category on the project's
	 * default status board and move the task there.
	 */
	private async syncCategoryFromStatus(
		task: iTask,
		newStatus: string
	): Promise<void> {
		// Find default status board for the project
		const boardRecords = await db
			.select()
			.from(boards)
			.where(
				and(
					eq(boards.projectId, task.projectId),
					eq(boards.type, "status"),
					eq(boards.isDefault, true)
				)
			)
			.limit(1);

		const board = boardRecords[0];
		if (!board) {return;}

		// Find category with matching statusValue
		const categoryRecords = await db
			.select()
			.from(categories)
			.where(
				and(
					eq(categories.boardId, board.id),
					eq(categories.statusValue, newStatus)
				)
			)
			.limit(1);

		const category = categoryRecords[0];
		if (!category) {return;}

		// Move task to that category
		if (task.categoryId !== category.id) {
			await db
				.update(tasks)
				.set({categoryId: category.id})
				.where(eq(tasks.id, task.id));
		}
	}

	private recordToTask(record: typeof tasks.$inferSelect): iTask {
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
			dueAt: record.dueAt?.toISOString() ?? null,
			startAt: record.startAt?.toISOString() ?? null,
			estimatedMinutes: record.estimatedMinutes,
			effortLevel: record.effortLevel ?? null,
			coverImage: record.coverImage,
			isArchived: record.isArchived,
			completedAt: record.completedAt?.toISOString() ?? null,
			createdAt: record.createdAt.toISOString(),
			updatedAt: record.updatedAt.toISOString(),
		};
	}
}
