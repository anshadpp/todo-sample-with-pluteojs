import type {Router, Request, Response, NextFunction} from "express";

import {
	createBoardBodySchema,
	updateBoardBodySchema,
	createCategoryBodySchema,
	updateCategoryBodySchema,
	reorderCategoriesBodySchema,
	boardResponseSchema,
	boardListResponseSchema,
	categoryResponseSchema,
	categoryListResponseSchema,
} from "@pluteojs/api-types";

import {isAuthorized} from "@api/middlewares/authorizationMiddleware";
import {validateBody} from "@validations/zodValidation";
import logger from "@loaders/logger";
import expressUtil from "@util/expressUtil";
import BoardsService from "@services/BoardsService";
import {registry} from "@openapi/registry";
import {SuccessEnvelope, ErrorEnvelope} from "@constants/openAPIConstants";

const boardsService = new BoardsService();

registry.registerPath({
	method: "get",
	path: "/api/v1/projects/{projectId}/boards/",
	summary: "List boards for a project",
	tags: ["Boards"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "Boards retrieved",
			content: {
				"application/json": {schema: SuccessEnvelope(boardListResponseSchema)},
			},
		},
	},
});

registry.registerPath({
	method: "post",
	path: "/api/v1/projects/{projectId}/boards/",
	summary: "Create a board",
	tags: ["Boards"],
	security: [{bearerAuth: []}],
	request: {
		body: {content: {"application/json": {schema: createBoardBodySchema}}},
	},
	responses: {
		201: {
			description: "Board created",
			content: {
				"application/json": {schema: SuccessEnvelope(boardResponseSchema)},
			},
		},
	},
});

registry.registerPath({
	method: "get",
	path: "/api/v1/boards/{boardId}",
	summary: "Get a board with categories",
	tags: ["Boards"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "Board retrieved",
			content: {
				"application/json": {schema: SuccessEnvelope(boardResponseSchema)},
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
	path: "/api/v1/boards/{boardId}",
	summary: "Update a board",
	tags: ["Boards"],
	security: [{bearerAuth: []}],
	request: {
		body: {content: {"application/json": {schema: updateBoardBodySchema}}},
	},
	responses: {
		200: {
			description: "Board updated",
			content: {
				"application/json": {schema: SuccessEnvelope(boardResponseSchema)},
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
	path: "/api/v1/boards/{boardId}",
	summary: "Delete a board",
	tags: ["Boards"],
	security: [{bearerAuth: []}],
	responses: {
		200: {description: "Board deleted"},
		404: {
			description: "Not found",
			content: {"application/json": {schema: ErrorEnvelope}},
		},
	},
});

registry.registerPath({
	method: "get",
	path: "/api/v1/boards/{boardId}/categories/",
	summary: "List categories for a board",
	tags: ["Categories"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "Categories retrieved",
			content: {
				"application/json": {
					schema: SuccessEnvelope(categoryListResponseSchema),
				},
			},
		},
	},
});

registry.registerPath({
	method: "post",
	path: "/api/v1/boards/{boardId}/categories/",
	summary: "Create a category",
	tags: ["Categories"],
	security: [{bearerAuth: []}],
	request: {
		body: {content: {"application/json": {schema: createCategoryBodySchema}}},
	},
	responses: {
		201: {
			description: "Category created",
			content: {
				"application/json": {schema: SuccessEnvelope(categoryResponseSchema)},
			},
		},
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/boards/{boardId}/categories/{categoryId}",
	summary: "Update a category",
	tags: ["Categories"],
	security: [{bearerAuth: []}],
	request: {
		body: {content: {"application/json": {schema: updateCategoryBodySchema}}},
	},
	responses: {
		200: {
			description: "Category updated",
			content: {
				"application/json": {schema: SuccessEnvelope(categoryResponseSchema)},
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
	path: "/api/v1/boards/{boardId}/categories/{categoryId}",
	summary: "Delete a category",
	tags: ["Categories"],
	security: [{bearerAuth: []}],
	responses: {
		200: {description: "Category deleted"},
		404: {
			description: "Not found",
			content: {"application/json": {schema: ErrorEnvelope}},
		},
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/boards/{boardId}/categories/reorder",
	summary: "Reorder categories",
	tags: ["Categories"],
	security: [{bearerAuth: []}],
	request: {
		body: {
			content: {"application/json": {schema: reorderCategoriesBodySchema}},
		},
	},
	responses: {
		200: {
			description: "Categories reordered",
			content: {
				"application/json": {
					schema: SuccessEnvelope(categoryListResponseSchema),
				},
			},
		},
	},
});

export default (route: Router): void => {
	// Board routes
	route.get(
		"/projects/:projectId/boards/",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "List boards request received");
			try {
				const data = await boardsService.getBoards(req.params.projectId!);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	route.post(
		"/projects/:projectId/boards/",
		isAuthorized,
		validateBody(createBoardBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Create board request received");
			try {
				const data = await boardsService.createBoard(
					req.params.projectId!,
					req.body
				);
				res.ok(data, 201);
			} catch (error) {
				next(error);
			}
		}
	);

	route.get(
		"/boards/:boardId",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Get board request received");
			try {
				const board = await boardsService.getBoard(req.params.boardId!);
				const cats = await boardsService.getCategories(req.params.boardId!);
				res.ok({...board, categories: cats});
			} catch (error) {
				next(error);
			}
		}
	);

	route.patch(
		"/boards/:boardId",
		isAuthorized,
		validateBody(updateBoardBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Update board request received");
			try {
				const data = await boardsService.updateBoard(
					req.params.boardId!,
					req.body
				);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	route.delete(
		"/boards/:boardId",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Delete board request received");
			try {
				await boardsService.deleteBoard(req.params.boardId!);
				res.ok({message: "Board deleted successfully"});
			} catch (error) {
				next(error);
			}
		}
	);

	// Category routes
	route.get(
		"/boards/:boardId/categories/",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "List categories request received");
			try {
				const data = await boardsService.getCategories(req.params.boardId!);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	route.post(
		"/boards/:boardId/categories/",
		isAuthorized,
		validateBody(createCategoryBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Create category request received");
			try {
				const data = await boardsService.createCategory(
					req.params.boardId!,
					req.body
				);
				res.ok(data, 201);
			} catch (error) {
				next(error);
			}
		}
	);

	route.patch(
		"/boards/:boardId/categories/reorder",
		isAuthorized,
		validateBody(reorderCategoriesBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Reorder categories request received");
			try {
				const data = await boardsService.reorderCategories(
					req.params.boardId!,
					req.body.categories
				);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	route.patch(
		"/boards/:boardId/categories/:categoryId",
		isAuthorized,
		validateBody(updateCategoryBodySchema),
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Update category request received");
			try {
				const data = await boardsService.updateCategory(
					req.params.categoryId!,
					req.body
				);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	route.delete(
		"/boards/:boardId/categories/:categoryId",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Delete category request received");
			try {
				await boardsService.deleteCategory(req.params.categoryId!);
				res.ok({message: "Category deleted successfully"});
			} catch (error) {
				next(error);
			}
		}
	);
};
