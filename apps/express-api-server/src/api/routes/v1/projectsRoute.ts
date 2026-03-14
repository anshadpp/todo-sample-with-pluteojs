import type {Router, Request, Response, NextFunction} from "express";

import {
	createProjectBodySchema,
	updateProjectBodySchema,
	projectResponseSchema,
	projectListResponseSchema,
} from "@pluteojs/api-types";

import {isAuthorized} from "@api/middlewares/authorizationMiddleware";
import {validateBody} from "@validations/zodValidation";
import logger from "@loaders/logger";
import expressUtil from "@util/expressUtil";
import ProjectsService from "@services/ProjectsService";
import {registry} from "@openapi/registry";
import {SuccessEnvelope, ErrorEnvelope} from "@constants/openAPIConstants";

const projectsService = new ProjectsService();

registry.registerPath({
	method: "post",
	path: "/api/v1/projects/",
	summary: "Create a new project",
	description: "Creates a new project. Organization is optional.",
	tags: ["Projects"],
	security: [{bearerAuth: []}],
	request: {
		body: {content: {"application/json": {schema: createProjectBodySchema}}},
	},
	responses: {
		201: {
			description: "Project created",
			content: {
				"application/json": {schema: SuccessEnvelope(projectResponseSchema)},
			},
		},
		401: {
			description: "Unauthorized",
			content: {"application/json": {schema: ErrorEnvelope}},
		},
	},
});

registry.registerPath({
	method: "get",
	path: "/api/v1/projects/",
	summary: "List projects",
	description:
		"Retrieves projects. If x-organization-id header is present, returns org projects. Otherwise returns personal projects.",
	tags: ["Projects"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "Projects retrieved",
			content: {
				"application/json": {
					schema: SuccessEnvelope(projectListResponseSchema),
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {"application/json": {schema: ErrorEnvelope}},
		},
	},
});

registry.registerPath({
	method: "get",
	path: "/api/v1/projects/{projectId}",
	summary: "Get a project",
	tags: ["Projects"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "Project retrieved",
			content: {
				"application/json": {schema: SuccessEnvelope(projectResponseSchema)},
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
	path: "/api/v1/projects/{projectId}",
	summary: "Update a project",
	tags: ["Projects"],
	security: [{bearerAuth: []}],
	request: {
		body: {content: {"application/json": {schema: updateProjectBodySchema}}},
	},
	responses: {
		200: {
			description: "Project updated",
			content: {
				"application/json": {schema: SuccessEnvelope(projectResponseSchema)},
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
	path: "/api/v1/projects/{projectId}",
	summary: "Delete a project",
	tags: ["Projects"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "Project deleted",
			content: {
				"application/json": {schema: SuccessEnvelope(projectResponseSchema)},
			},
		},
		404: {
			description: "Not found",
			content: {"application/json": {schema: ErrorEnvelope}},
		},
	},
});

export default (route: Router): void => {
	route.post(
		"/projects/",
		isAuthorized,
		validateBody(createProjectBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Create project request received");
			try {
				const userId = req.user?.id;
				if (!userId) {
					throw new Error("User ID not found in session");
				}
				const organizationId =
					(req.headers["x-organization-id"] as string) || null;

				const data = await projectsService.createProject(
					userId,
					organizationId,
					req.body
				);
				res.ok(data, 201);
			} catch (error) {
				next(error);
			}
		}
	);

	route.get(
		"/projects/",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "List projects request received");
			try {
				const userId = req.user?.id;
				if (!userId) {
					throw new Error("User ID not found in session");
				}
				const organizationId =
					(req.headers["x-organization-id"] as string) || null;

				const data = await projectsService.getProjects(userId, organizationId);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	route.get(
		"/projects/:projectId",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Get project request received");
			try {
				const userId = req.user?.id;
				if (!userId) {
					throw new Error("User ID not found in session");
				}

				const data = await projectsService.getProject(
					req.params.projectId!,
					userId
				);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	route.patch(
		"/projects/:projectId",
		isAuthorized,
		validateBody(updateProjectBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Update project request received");
			try {
				const userId = req.user?.id;
				if (!userId) {
					throw new Error("User ID not found in session");
				}

				const data = await projectsService.updateProject(
					req.params.projectId!,
					userId,
					req.body
				);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	route.delete(
		"/projects/:projectId",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Delete project request received");
			try {
				const userId = req.user?.id;
				if (!userId) {
					throw new Error("User ID not found in session");
				}

				await projectsService.deleteProject(req.params.projectId!, userId);
				res.ok({message: "Project deleted successfully"});
			} catch (error) {
				next(error);
			}
		}
	);
};
