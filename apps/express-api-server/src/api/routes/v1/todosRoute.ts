import type {Router, Request, Response, NextFunction} from "express";

import {
	todoResponseSchema,
	todoListResponseSchema,
	createTodoBodySchema,
	updateTodoBodySchema,
} from "@pluteojs/api-types";

import {isAuthorized} from "@api/middlewares/authorizationMiddleware";
import {validateBody} from "@validations/zodValidation";
import logger from "@loaders/logger";
import expressUtil from "@util/expressUtil";
import TodosService from "@services/TodosService";
import {registry} from "@openapi/registry";
import {SuccessEnvelope, ErrorEnvelope} from "@constants/openAPIConstants";

const todosService = new TodosService();

// Register OpenAPI documentation for POST /api/v1/todos/
registry.registerPath({
	method: "post",
	path: "/api/v1/todos/",
	summary: "Create a new todo",
	description: "Creates a new todo item for the authenticated user.",
	tags: ["Todos"],
	security: [{bearerAuth: []}],
	request: {
		body: {
			content: {
				"application/json": {
					schema: createTodoBodySchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Todo created successfully",
			content: {
				"application/json": {
					schema: SuccessEnvelope(todoResponseSchema),
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {"application/json": {schema: ErrorEnvelope}},
		},
	},
});

// Register OpenAPI documentation for GET /api/v1/todos/
registry.registerPath({
	method: "get",
	path: "/api/v1/todos/",
	summary: "List all todos",
	description: "Retrieves all todo items for the authenticated user.",
	tags: ["Todos"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "Todos retrieved successfully",
			content: {
				"application/json": {
					schema: SuccessEnvelope(todoListResponseSchema),
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {"application/json": {schema: ErrorEnvelope}},
		},
	},
});

// Register OpenAPI documentation for GET /api/v1/todos/:todoId
registry.registerPath({
	method: "get",
	path: "/api/v1/todos/{todoId}",
	summary: "Get a todo",
	description: "Retrieves a specific todo item by ID.",
	tags: ["Todos"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "Todo retrieved successfully",
			content: {
				"application/json": {
					schema: SuccessEnvelope(todoResponseSchema),
				},
			},
		},
		404: {
			description: "Todo not found",
			content: {"application/json": {schema: ErrorEnvelope}},
		},
	},
});

// Register OpenAPI documentation for PATCH /api/v1/todos/:todoId
registry.registerPath({
	method: "patch",
	path: "/api/v1/todos/{todoId}",
	summary: "Update a todo",
	description: "Updates a specific todo item.",
	tags: ["Todos"],
	security: [{bearerAuth: []}],
	request: {
		body: {
			content: {
				"application/json": {
					schema: updateTodoBodySchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Todo updated successfully",
			content: {
				"application/json": {
					schema: SuccessEnvelope(todoResponseSchema),
				},
			},
		},
		404: {
			description: "Todo not found",
			content: {"application/json": {schema: ErrorEnvelope}},
		},
	},
});

// Register OpenAPI documentation for DELETE /api/v1/todos/:todoId
registry.registerPath({
	method: "delete",
	path: "/api/v1/todos/{todoId}",
	summary: "Delete a todo",
	description: "Deletes a specific todo item.",
	tags: ["Todos"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "Todo deleted successfully",
			content: {
				"application/json": {
					schema: SuccessEnvelope(todoResponseSchema),
				},
			},
		},
		404: {
			description: "Todo not found",
			content: {"application/json": {schema: ErrorEnvelope}},
		},
	},
});

/**
 * Todos route handler.
 *
 * @param route - Express router
 */
export default (route: Router): void => {
	/**
	 * POST /todos/
	 * Creates a new todo.
	 */
	route.post(
		"/todos/",
		isAuthorized,
		validateBody(createTodoBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Create todo request received");

			try {
				const userId = req.user?.id;
				if (!userId) {throw new Error("User ID not found in session");}

				const data = await todosService.createTodo(userId, req.body);
				res.ok(data, 201);
			} catch (error) {
				next(error);
			}
		},
	);

	/**
	 * GET /todos/
	 * Gets all todos for the current user.
	 */
	route.get(
		"/todos/",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Get todos request received");

			try {
				const userId = req.user?.id;
				if (!userId) {throw new Error("User ID not found in session");}

				const data = await todosService.getTodos(userId);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		},
	);

	/**
	 * GET /todos/:todoId
	 * Gets a single todo by ID.
	 */
	route.get(
		"/todos/:todoId",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Get todo request received");

			try {
				const userId = req.user?.id;
				if (!userId) {throw new Error("User ID not found in session");}

				const data = await todosService.getTodo(userId, req.params.todoId!);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		},
	);

	/**
	 * PATCH /todos/:todoId
	 * Updates a todo.
	 */
	route.patch(
		"/todos/:todoId",
		isAuthorized,
		validateBody(updateTodoBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Update todo request received");

			try {
				const userId = req.user?.id;
				if (!userId) {throw new Error("User ID not found in session");}

				const data = await todosService.updateTodo(userId, req.params.todoId!, req.body);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		},
	);

	/**
	 * DELETE /todos/:todoId
	 * Deletes a todo.
	 */
	route.delete(
		"/todos/:todoId",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Delete todo request received");

			try {
				const userId = req.user?.id;
				if (!userId) {throw new Error("User ID not found in session");}

				await todosService.deleteTodo(userId, req.params.todoId!);
				res.ok({message: "Todo deleted successfully"});
			} catch (error) {
				next(error);
			}
		},
	);
};
