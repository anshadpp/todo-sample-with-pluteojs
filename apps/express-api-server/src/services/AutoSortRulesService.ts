import {db, eq, asc, autoSortRules} from "@pluteojs/database";

import logger from "@loaders/logger";

import {httpStatusCodes} from "@customTypes/networkTypes";
import type {
	iAutoSortRule,
	iCreateAutoSortRuleDTO,
	iUpdateAutoSortRuleDTO,
} from "@customTypes/appDataTypes/taskTypes";

import {ServiceError} from "@errors/ServiceError";
import {autoSortRuleServiceError} from "@constants/errors/autoSortRuleServiceErrors";

export default class AutoSortRulesService {
	private toDTO(record: typeof autoSortRules.$inferSelect): iAutoSortRule {
		return {
			id: record.id,
			projectId: record.projectId,
			name: record.name,
			description: record.description,
			conditionField: record.conditionField,
			conditionOperator: record.conditionOperator,
			conditionValue: record.conditionValue,
			actionType: record.actionType,
			actionValue: record.actionValue,
			isEnabled: record.isEnabled,
			sortOrder: record.sortOrder,
			stopOnMatch: record.stopOnMatch,
			createdAt: record.createdAt.toISOString(),
			updatedAt: record.updatedAt.toISOString(),
		};
	}

	public async getRulesByProject(
		projectId: string
	): Promise<iAutoSortRule[]> {
		logger.silly("Retrieving auto-sort rules for project");

		const records = await db
			.select()
			.from(autoSortRules)
			.where(eq(autoSortRules.projectId, projectId))
			.orderBy(asc(autoSortRules.sortOrder));

		return records.map((r) => {return this.toDTO(r);});
	}

	public async getEnabledRulesByProject(
		projectId: string
	): Promise<iAutoSortRule[]> {
		logger.silly("Retrieving enabled auto-sort rules for project");

		const records = await db
			.select()
			.from(autoSortRules)
			.where(
				eq(autoSortRules.projectId, projectId)
			)
			.orderBy(asc(autoSortRules.sortOrder));

		return records
			.filter((r) => {return r.isEnabled;})
			.map((r) => {return this.toDTO(r);});
	}

	public async getRule(ruleId: string): Promise<iAutoSortRule> {
		logger.silly("Retrieving auto-sort rule by id");

		const records = await db
			.select()
			.from(autoSortRules)
			.where(eq(autoSortRules.id, ruleId))
			.limit(1);

		const record = records[0];
		if (!record) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				autoSortRuleServiceError.getRule.RuleNotFound
			);
		}

		return this.toDTO(record);
	}

	public async createRule(
		projectId: string,
		input: iCreateAutoSortRuleDTO
	): Promise<iAutoSortRule> {
		logger.silly("Creating a new auto-sort rule");

		const result = await db
			.insert(autoSortRules)
			.values({
				projectId,
				name: input.name,
				description: input.description ?? null,
				conditionField: input.conditionField,
				conditionOperator: input.conditionOperator,
				conditionValue: input.conditionValue ?? null,
				actionType: input.actionType,
				actionValue: input.actionValue,
				isEnabled: input.isEnabled ?? true,
				sortOrder: input.sortOrder ?? 0,
				stopOnMatch: input.stopOnMatch ?? true,
			})
			.returning();

		const record = result[0]!;
		logger.silly("Auto-sort rule created successfully");
		return this.toDTO(record);
	}

	public async updateRule(
		ruleId: string,
		input: iUpdateAutoSortRuleDTO
	): Promise<iAutoSortRule> {
		logger.silly("Updating auto-sort rule");

		const updateValues: Record<string, unknown> = {};
		if (input.name !== undefined) {updateValues.name = input.name;}
		if (input.description !== undefined)
		{updateValues.description = input.description;}
		if (input.conditionField !== undefined)
		{updateValues.conditionField = input.conditionField;}
		if (input.conditionOperator !== undefined)
		{updateValues.conditionOperator = input.conditionOperator;}
		if (input.conditionValue !== undefined)
		{updateValues.conditionValue = input.conditionValue;}
		if (input.actionType !== undefined)
		{updateValues.actionType = input.actionType;}
		if (input.actionValue !== undefined)
		{updateValues.actionValue = input.actionValue;}
		if (input.isEnabled !== undefined)
		{updateValues.isEnabled = input.isEnabled;}
		if (input.sortOrder !== undefined)
		{updateValues.sortOrder = input.sortOrder;}
		if (input.stopOnMatch !== undefined)
		{updateValues.stopOnMatch = input.stopOnMatch;}

		const result = await db
			.update(autoSortRules)
			.set(updateValues)
			.where(eq(autoSortRules.id, ruleId))
			.returning();

		const record = result[0];
		if (!record) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				autoSortRuleServiceError.updateRule.RuleNotFound
			);
		}

		logger.silly("Auto-sort rule updated successfully");
		return this.toDTO(record);
	}

	public async deleteRule(ruleId: string): Promise<void> {
		logger.silly("Deleting auto-sort rule");

		const result = await db
			.delete(autoSortRules)
			.where(eq(autoSortRules.id, ruleId))
			.returning({id: autoSortRules.id});

		if (result.length === 0) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				autoSortRuleServiceError.deleteRule.RuleNotFound
			);
		}

		logger.silly("Auto-sort rule deleted successfully");
	}
}
