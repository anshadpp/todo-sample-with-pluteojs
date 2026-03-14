import {z} from "zod";

import {uuidv4Schema} from "./common.js";

export const conditionFieldEnum = z.enum([
	"dueAt",
	"status",
	"priority",
	"completedAt",
	"isArchived",
	"assigneeId",
	"effortLevel",
]);

export const conditionOperatorEnum = z.enum([
	"eq",
	"neq",
	"lt_now",
	"gt_now",
	"is_null",
	"is_not_null",
]);

export const actionTypeEnum = z.enum([
	"move_to_category",
	"set_status",
	"set_priority",
	"archive",
]);

export const autoSortRuleSchema = z.object({
	id: uuidv4Schema,
	projectId: uuidv4Schema,
	name: z.string().min(1),
	description: z.string().nullable(),
	conditionField: conditionFieldEnum,
	conditionOperator: conditionOperatorEnum,
	conditionValue: z.string().nullable(),
	actionType: actionTypeEnum,
	actionValue: z.string().min(1),
	isEnabled: z.boolean(),
	sortOrder: z.number(),
	stopOnMatch: z.boolean(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const createAutoSortRuleBodySchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	conditionField: conditionFieldEnum,
	conditionOperator: conditionOperatorEnum,
	conditionValue: z.string().optional(),
	actionType: actionTypeEnum,
	actionValue: z.string().min(1, "Action value is required"),
	isEnabled: z.boolean().optional(),
	sortOrder: z.number().optional(),
	stopOnMatch: z.boolean().optional(),
});

export const updateAutoSortRuleBodySchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().nullable().optional(),
	conditionField: conditionFieldEnum.optional(),
	conditionOperator: conditionOperatorEnum.optional(),
	conditionValue: z.string().nullable().optional(),
	actionType: actionTypeEnum.optional(),
	actionValue: z.string().min(1).optional(),
	isEnabled: z.boolean().optional(),
	sortOrder: z.number().optional(),
	stopOnMatch: z.boolean().optional(),
});

export const autoSortRuleResponseSchema = autoSortRuleSchema;
export const autoSortRuleListResponseSchema = z.array(autoSortRuleSchema);

export type AutoSortRuleItem = z.infer<typeof autoSortRuleSchema>;
export type CreateAutoSortRuleBody = z.infer<
	typeof createAutoSortRuleBodySchema
>;
export type UpdateAutoSortRuleBody = z.infer<
	typeof updateAutoSortRuleBodySchema
>;
