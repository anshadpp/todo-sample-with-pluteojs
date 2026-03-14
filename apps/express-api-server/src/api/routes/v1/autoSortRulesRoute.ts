import type {Router, Request, Response, NextFunction} from "express";

import {
	createAutoSortRuleBodySchema,
	updateAutoSortRuleBodySchema,
	autoSortRuleResponseSchema,
	autoSortRuleListResponseSchema,
} from "@pluteojs/api-types";

import {isAuthorized} from "@api/middlewares/authorizationMiddleware";
import {validateBody} from "@validations/zodValidation";
import logger from "@loaders/logger";
import expressUtil from "@util/expressUtil";
import AutoSortRulesService from "@services/AutoSortRulesService";
import AutoSortEngineService from "@services/AutoSortEngineService";
import {registry} from "@openapi/registry";
import {SuccessEnvelope, ErrorEnvelope} from "@constants/openAPIConstants";

const rulesService = new AutoSortRulesService();
const engineService = new AutoSortEngineService();

// OpenAPI registrations

registry.registerPath({
	method: "get",
	path: "/api/v1/projects/{projectId}/auto-sort-rules/",
	summary: "List auto-sort rules for a project",
	tags: ["Auto-Sort Rules"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "Rules retrieved",
			content: {
				"application/json": {
					schema: SuccessEnvelope(autoSortRuleListResponseSchema),
				},
			},
		},
	},
});

registry.registerPath({
	method: "post",
	path: "/api/v1/projects/{projectId}/auto-sort-rules/",
	summary: "Create an auto-sort rule",
	tags: ["Auto-Sort Rules"],
	security: [{bearerAuth: []}],
	request: {
		body: {
			content: {
				"application/json": {schema: createAutoSortRuleBodySchema},
			},
		},
	},
	responses: {
		201: {
			description: "Rule created",
			content: {
				"application/json": {
					schema: SuccessEnvelope(autoSortRuleResponseSchema),
				},
			},
		},
	},
});

registry.registerPath({
	method: "get",
	path: "/api/v1/auto-sort-rules/{ruleId}",
	summary: "Get an auto-sort rule",
	tags: ["Auto-Sort Rules"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "Rule retrieved",
			content: {
				"application/json": {
					schema: SuccessEnvelope(autoSortRuleResponseSchema),
				},
			},
		},
		404: {
			description: "Not found",
			content: {"application/json": {schema: ErrorEnvelope}},
		},
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/auto-sort-rules/{ruleId}",
	summary: "Update an auto-sort rule",
	tags: ["Auto-Sort Rules"],
	security: [{bearerAuth: []}],
	request: {
		body: {
			content: {
				"application/json": {schema: updateAutoSortRuleBodySchema},
			},
		},
	},
	responses: {
		200: {
			description: "Rule updated",
			content: {
				"application/json": {
					schema: SuccessEnvelope(autoSortRuleResponseSchema),
				},
			},
		},
		404: {
			description: "Not found",
			content: {"application/json": {schema: ErrorEnvelope}},
		},
	},
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/auto-sort-rules/{ruleId}",
	summary: "Delete an auto-sort rule",
	tags: ["Auto-Sort Rules"],
	security: [{bearerAuth: []}],
	responses: {
		200: {description: "Rule deleted"},
		404: {
			description: "Not found",
			content: {"application/json": {schema: ErrorEnvelope}},
		},
	},
});

registry.registerPath({
	method: "post",
	path: "/api/v1/projects/{projectId}/auto-sort-rules/evaluate",
	summary: "Manually trigger auto-sort evaluation for all tasks in a project",
	tags: ["Auto-Sort Rules"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "Evaluation completed",
		},
	},
});

export default (route: Router): void => {
	// List rules for a project
	route.get(
		"/projects/:projectId/auto-sort-rules/",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "List auto-sort rules request received");
			try {
				const data = await rulesService.getRulesByProject(
					req.params.projectId!
				);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	// Create a rule
	route.post(
		"/projects/:projectId/auto-sort-rules/",
		isAuthorized,
		validateBody(createAutoSortRuleBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Create auto-sort rule request received");
			try {
				const data = await rulesService.createRule(
					req.params.projectId!,
					req.body
				);
				res.ok(data, 201);
			} catch (error) {
				next(error);
			}
		}
	);

	// Get a single rule
	route.get(
		"/auto-sort-rules/:ruleId",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Get auto-sort rule request received");
			try {
				const data = await rulesService.getRule(req.params.ruleId!);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	// Update a rule
	route.patch(
		"/auto-sort-rules/:ruleId",
		isAuthorized,
		validateBody(updateAutoSortRuleBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Update auto-sort rule request received");
			try {
				const data = await rulesService.updateRule(
					req.params.ruleId!,
					req.body
				);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	// Delete a rule
	route.delete(
		"/auto-sort-rules/:ruleId",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Delete auto-sort rule request received");
			try {
				await rulesService.deleteRule(req.params.ruleId!);
				res.ok({message: "Auto-sort rule deleted successfully"});
			} catch (error) {
				next(error);
			}
		}
	);

	// Manually trigger evaluation
	route.post(
		"/projects/:projectId/auto-sort-rules/evaluate",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(
				uniqueRequestId,
				"Manual auto-sort evaluation request received"
			);
			try {
				const actionsApplied =
					await engineService.evaluateAllTasksForProject(
						req.params.projectId!
					);
				res.ok({actionsApplied});
			} catch (error) {
				next(error);
			}
		}
	);
};
