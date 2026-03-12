import type {Router, Request, Response, NextFunction} from "express";

import {
	createTaskBodySchema,
	updateTaskBodySchema,
	moveTaskBodySchema,
	reorderTasksBodySchema,
	createCommentBodySchema,
	updateCommentBodySchema,
	createLabelBodySchema,
	updateLabelBodySchema,
	createTaskContentBodySchema,
	updateTaskContentBodySchema,
	taskResponseSchema,
	taskListResponseSchema,
	commentResponseSchema,
	commentListResponseSchema,
	labelResponseSchema,
	labelListResponseSchema,
	activityListResponseSchema,
	taskContentResponseSchema,
	taskContentListResponseSchema,
} from "@pluteojs/api-types";

import {isAuthorized} from "@api/middlewares/authorizationMiddleware";
import {validateBody} from "@validations/zodValidation";
import logger from "@loaders/logger";
import expressUtil from "@util/expressUtil";
import TasksService from "@services/TasksService";
import CommentsService from "@services/CommentsService";
import LabelsService from "@services/LabelsService";
import ActivityService from "@services/ActivityService";
import NotificationsService from "@services/NotificationsService";
import TaskContentsService from "@services/TaskContentsService";
import {registry} from "@openapi/registry";
import {SuccessEnvelope, ErrorEnvelope} from "@constants/openAPIConstants";

const tasksService = new TasksService();
const commentsService = new CommentsService();
const labelsService = new LabelsService();
const activityService = new ActivityService();
const notificationsService = new NotificationsService();
const taskContentsService = new TaskContentsService();

// OpenAPI registrations
registry.registerPath({
	method: "post",
	path: "/api/v1/projects/{projectId}/tasks/",
	summary: "Create a task",
	tags: ["Tasks"],
	security: [{bearerAuth: []}],
	request: {
		body: {content: {"application/json": {schema: createTaskBodySchema}}},
	},
	responses: {
		201: {
			description: "Task created",
			content: {
				"application/json": {schema: SuccessEnvelope(taskResponseSchema)},
			},
		},
	},
});

registry.registerPath({
	method: "get",
	path: "/api/v1/projects/{projectId}/tasks/",
	summary: "List tasks for a project",
	tags: ["Tasks"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "Tasks retrieved",
			content: {
				"application/json": {schema: SuccessEnvelope(taskListResponseSchema)},
			},
		},
	},
});

registry.registerPath({
	method: "get",
	path: "/api/v1/tasks/{taskId}",
	summary: "Get task detail",
	tags: ["Tasks"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "Task retrieved",
			content: {
				"application/json": {schema: SuccessEnvelope(taskResponseSchema)},
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
	path: "/api/v1/tasks/{taskId}",
	summary: "Update a task",
	tags: ["Tasks"],
	security: [{bearerAuth: []}],
	request: {
		body: {content: {"application/json": {schema: updateTaskBodySchema}}},
	},
	responses: {
		200: {
			description: "Task updated",
			content: {
				"application/json": {schema: SuccessEnvelope(taskResponseSchema)},
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
	path: "/api/v1/tasks/{taskId}/move",
	summary: "Move task to another category",
	tags: ["Tasks"],
	security: [{bearerAuth: []}],
	request: {
		body: {content: {"application/json": {schema: moveTaskBodySchema}}},
	},
	responses: {
		200: {
			description: "Task moved",
			content: {
				"application/json": {schema: SuccessEnvelope(taskResponseSchema)},
			},
		},
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/tasks/reorder",
	summary: "Reorder tasks",
	tags: ["Tasks"],
	security: [{bearerAuth: []}],
	request: {
		body: {content: {"application/json": {schema: reorderTasksBodySchema}}},
	},
	responses: {
		200: {description: "Tasks reordered"},
	},
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/tasks/{taskId}",
	summary: "Delete a task",
	tags: ["Tasks"],
	security: [{bearerAuth: []}],
	responses: {
		200: {description: "Task deleted"},
		404: {
			description: "Not found",
			content: {"application/json": {schema: ErrorEnvelope}},
		},
	},
});

// Comments
registry.registerPath({
	method: "get",
	path: "/api/v1/tasks/{taskId}/comments/",
	summary: "List comments",
	tags: ["Comments"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "Comments retrieved",
			content: {
				"application/json": {
					schema: SuccessEnvelope(commentListResponseSchema),
				},
			},
		},
	},
});

registry.registerPath({
	method: "post",
	path: "/api/v1/tasks/{taskId}/comments/",
	summary: "Add a comment",
	tags: ["Comments"],
	security: [{bearerAuth: []}],
	request: {
		body: {content: {"application/json": {schema: createCommentBodySchema}}},
	},
	responses: {
		201: {
			description: "Comment created",
			content: {
				"application/json": {schema: SuccessEnvelope(commentResponseSchema)},
			},
		},
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/tasks/{taskId}/comments/{commentId}",
	summary: "Edit a comment",
	tags: ["Comments"],
	security: [{bearerAuth: []}],
	request: {
		body: {content: {"application/json": {schema: updateCommentBodySchema}}},
	},
	responses: {
		200: {
			description: "Comment updated",
			content: {
				"application/json": {schema: SuccessEnvelope(commentResponseSchema)},
			},
		},
	},
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/tasks/{taskId}/comments/{commentId}",
	summary: "Delete a comment",
	tags: ["Comments"],
	security: [{bearerAuth: []}],
	responses: {
		200: {description: "Comment deleted"},
	},
});

// Labels
registry.registerPath({
	method: "get",
	path: "/api/v1/projects/{projectId}/labels/",
	summary: "List labels for a project",
	tags: ["Labels"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "Labels retrieved",
			content: {
				"application/json": {schema: SuccessEnvelope(labelListResponseSchema)},
			},
		},
	},
});

registry.registerPath({
	method: "post",
	path: "/api/v1/projects/{projectId}/labels/",
	summary: "Create a label",
	tags: ["Labels"],
	security: [{bearerAuth: []}],
	request: {
		body: {content: {"application/json": {schema: createLabelBodySchema}}},
	},
	responses: {
		201: {
			description: "Label created",
			content: {
				"application/json": {schema: SuccessEnvelope(labelResponseSchema)},
			},
		},
	},
});

registry.registerPath({
	method: "post",
	path: "/api/v1/tasks/{taskId}/labels/{labelId}",
	summary: "Add label to task",
	tags: ["Labels"],
	security: [{bearerAuth: []}],
	responses: {201: {description: "Label added to task"}},
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/tasks/{taskId}/labels/{labelId}",
	summary: "Remove label from task",
	tags: ["Labels"],
	security: [{bearerAuth: []}],
	responses: {200: {description: "Label removed from task"}},
});

// Activity
registry.registerPath({
	method: "get",
	path: "/api/v1/tasks/{taskId}/activity/",
	summary: "Get task activity log",
	tags: ["Activity"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "Activity retrieved",
			content: {
				"application/json": {
					schema: SuccessEnvelope(activityListResponseSchema),
				},
			},
		},
	},
});

// Task Contents
registry.registerPath({
	method: "get",
	path: "/api/v1/tasks/{taskId}/contents/",
	summary: "List task contents",
	tags: ["Task Contents"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "Contents retrieved",
			content: {
				"application/json": {
					schema: SuccessEnvelope(taskContentListResponseSchema),
				},
			},
		},
	},
});

registry.registerPath({
	method: "post",
	path: "/api/v1/tasks/{taskId}/contents/",
	summary: "Add content to task",
	tags: ["Task Contents"],
	security: [{bearerAuth: []}],
	request: {
		body: {
			content: {"application/json": {schema: createTaskContentBodySchema}},
		},
	},
	responses: {
		201: {
			description: "Content created",
			content: {
				"application/json": {
					schema: SuccessEnvelope(taskContentResponseSchema),
				},
			},
		},
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/tasks/{taskId}/contents/{contentId}",
	summary: "Update task content",
	tags: ["Task Contents"],
	security: [{bearerAuth: []}],
	request: {
		body: {
			content: {"application/json": {schema: updateTaskContentBodySchema}},
		},
	},
	responses: {
		200: {
			description: "Content updated",
			content: {
				"application/json": {
					schema: SuccessEnvelope(taskContentResponseSchema),
				},
			},
		},
	},
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/tasks/{taskId}/contents/{contentId}",
	summary: "Delete task content",
	tags: ["Task Contents"],
	security: [{bearerAuth: []}],
	responses: {
		200: {description: "Content deleted"},
	},
});

export default (route: Router): void => {
	// Task CRUD
	route.post(
		"/projects/:projectId/tasks/",
		isAuthorized,
		validateBody(createTaskBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Create task request received");
			try {
				const userId = req.user?.id;
				if (!userId) {
					throw new Error("User ID not found in session");
				}

				const data = await tasksService.createTask(
					userId,
					req.params.projectId!,
					req.body
				);
				await activityService.logActivity(data.id, userId, "created");

				// Notify assignee
				if (req.body.assigneeId && req.body.assigneeId !== userId) {
					await notificationsService.createNotification(
						req.body.assigneeId,
						"task_assigned",
						`You were assigned to "${data.title}"`,
						undefined,
						"task",
						data.id
					);
				}

				res.ok(data, 201);
			} catch (error) {
				next(error);
			}
		}
	);

	route.get(
		"/projects/:projectId/tasks/",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "List tasks request received");
			try {
				const data = await tasksService.getTasksByProject(
					req.params.projectId!
				);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	// Reorder must be registered before :taskId to avoid matching "reorder" as a UUID
	route.patch(
		"/tasks/reorder",
		isAuthorized,
		validateBody(reorderTasksBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Reorder tasks request received");
			try {
				await tasksService.reorderTasks(req.body.tasks);
				res.ok({message: "Tasks reordered successfully"});
			} catch (error) {
				next(error);
			}
		}
	);

	route.get(
		"/tasks/:taskId",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Get task request received");
			try {
				const data = await tasksService.getTask(req.params.taskId!);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	route.patch(
		"/tasks/:taskId",
		isAuthorized,
		validateBody(updateTaskBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Update task request received");
			try {
				const userId = req.user?.id;
				if (!userId) {
					throw new Error("User ID not found in session");
				}

				// Get old task for activity logging
				const oldTask = await tasksService.getTask(req.params.taskId!);
				const data = await tasksService.updateTask(
					req.params.taskId!,
					req.body
				);

				// Log field changes
				for (const key of Object.keys(req.body)) {
					const oldVal = (oldTask as unknown as Record<string, unknown>)[key];
					const newVal = (data as unknown as Record<string, unknown>)[key];
					if (oldVal !== newVal) {
						await activityService.logActivity(
							data.id,
							userId,
							"updated",
							key,
							oldVal != null ? String(oldVal) : (null as unknown as string),
							newVal != null ? String(newVal) : (null as unknown as string)
						);
					}
				}

				// Notify on assignment change
				if (
					req.body.assigneeId &&
					req.body.assigneeId !== userId &&
					req.body.assigneeId !== oldTask.assigneeId
				) {
					await notificationsService.createNotification(
						req.body.assigneeId,
						"task_assigned",
						`You were assigned to "${data.title}"`,
						undefined,
						"task",
						data.id
					);
				}

				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	route.patch(
		"/tasks/:taskId/move",
		isAuthorized,
		validateBody(moveTaskBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Move task request received");
			try {
				const userId = req.user?.id;
				if (!userId) {
					throw new Error("User ID not found in session");
				}

				const oldTask = await tasksService.getTask(req.params.taskId!);
				const data = await tasksService.moveTask(req.params.taskId!, req.body);
				await activityService.logActivity(
					data.id,
					userId,
					"moved",
					"categoryId",
					oldTask.categoryId ?? undefined,
					data.categoryId ?? undefined
				);

				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	route.delete(
		"/tasks/:taskId",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Delete task request received");
			try {
				await tasksService.deleteTask(req.params.taskId!);
				res.ok({message: "Task deleted successfully"});
			} catch (error) {
				next(error);
			}
		}
	);

	// Comments
	route.get(
		"/tasks/:taskId/comments/",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const data = await commentsService.getComments(req.params.taskId!);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	route.post(
		"/tasks/:taskId/comments/",
		isAuthorized,
		validateBody(createCommentBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const userId = req.user?.id;
				if (!userId) {
					throw new Error("User ID not found in session");
				}

				const data = await commentsService.createComment(
					userId,
					req.params.taskId!,
					req.body
				);
				await activityService.logActivity(data.taskId, userId, "commented");

				res.ok(data, 201);
			} catch (error) {
				next(error);
			}
		}
	);

	route.patch(
		"/tasks/:taskId/comments/:commentId",
		isAuthorized,
		validateBody(updateCommentBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const userId = req.user?.id;
				if (!userId) {
					throw new Error("User ID not found in session");
				}

				const data = await commentsService.updateComment(
					userId,
					req.params.commentId!,
					req.body
				);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	route.delete(
		"/tasks/:taskId/comments/:commentId",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const userId = req.user?.id;
				if (!userId) {
					throw new Error("User ID not found in session");
				}

				await commentsService.deleteComment(userId, req.params.commentId!);
				res.ok({message: "Comment deleted successfully"});
			} catch (error) {
				next(error);
			}
		}
	);

	// Labels
	route.get(
		"/projects/:projectId/labels/",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const data = await labelsService.getLabels(req.params.projectId!);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	route.post(
		"/projects/:projectId/labels/",
		isAuthorized,
		validateBody(createLabelBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const data = await labelsService.createLabel(
					req.params.projectId!,
					req.body
				);
				res.ok(data, 201);
			} catch (error) {
				next(error);
			}
		}
	);

	route.post(
		"/tasks/:taskId/labels/:labelId",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				await labelsService.addLabelToTask(
					req.params.taskId!,
					req.params.labelId!
				);
				res.ok({message: "Label added to task"}, 201);
			} catch (error) {
				next(error);
			}
		}
	);

	route.delete(
		"/tasks/:taskId/labels/:labelId",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				await labelsService.removeLabelFromTask(
					req.params.taskId!,
					req.params.labelId!
				);
				res.ok({message: "Label removed from task"});
			} catch (error) {
				next(error);
			}
		}
	);

	// Activity
	route.get(
		"/tasks/:taskId/activity/",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const data = await activityService.getActivities(req.params.taskId!);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	// Task Dependencies
	route.get(
		"/tasks/:taskId/dependencies/",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const data = await tasksService.getDependencies(req.params.taskId!);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	route.post(
		"/tasks/:taskId/dependencies/",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const userId = req.user?.id;
				if (!userId) {
					throw new Error("User ID not found in session");
				}

				const {dependsOnTaskId, dependencyType} = req.body;
				if (!dependsOnTaskId) {
					res.fail("dependsOnTaskId is required", 400);
					return;
				}

				const data = await tasksService.addDependency(
					req.params.taskId!,
					dependsOnTaskId,
					dependencyType || "blocks"
				);

				await activityService.logActivity(
					req.params.taskId!,
					userId,
					"added_dependency",
					"dependency",
					null as unknown as string,
					dependsOnTaskId
				);

				res.ok(data, 201);
			} catch (error) {
				next(error);
			}
		}
	);

	route.delete(
		"/tasks/:taskId/dependencies/:dependencyId",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const userId = req.user?.id;
				if (!userId) {
					throw new Error("User ID not found in session");
				}

				await tasksService.removeDependency(req.params.dependencyId!);

				await activityService.logActivity(
					req.params.taskId!,
					userId,
					"removed_dependency"
				);

				res.ok({message: "Dependency removed successfully"});
			} catch (error) {
				next(error);
			}
		}
	);

	// Task Contents (code snippets, docs, links, notes)
	route.get(
		"/tasks/:taskId/contents/",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const data = await taskContentsService.getContents(req.params.taskId!);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	route.post(
		"/tasks/:taskId/contents/",
		isAuthorized,
		validateBody(createTaskContentBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const userId = req.user?.id;
				if (!userId) {
					throw new Error("User ID not found in session");
				}

				const data = await taskContentsService.createContent(
					userId,
					req.params.taskId!,
					req.body
				);
				await activityService.logActivity(
					req.params.taskId!,
					userId,
					"added_content"
				);

				res.ok(data, 201);
			} catch (error) {
				next(error);
			}
		}
	);

	route.patch(
		"/tasks/:taskId/contents/:contentId",
		isAuthorized,
		validateBody(updateTaskContentBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const userId = req.user?.id;
				if (!userId) {
					throw new Error("User ID not found in session");
				}

				const data = await taskContentsService.updateContent(
					userId,
					req.params.contentId!,
					req.body
				);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	route.delete(
		"/tasks/:taskId/contents/:contentId",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const userId = req.user?.id;
				if (!userId) {
					throw new Error("User ID not found in session");
				}

				await taskContentsService.deleteContent(userId, req.params.contentId!);
				await activityService.logActivity(
					req.params.taskId!,
					userId,
					"removed_content"
				);

				res.ok({message: "Content deleted successfully"});
			} catch (error) {
				next(error);
			}
		}
	);
};
