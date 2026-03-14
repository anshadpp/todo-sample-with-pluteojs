import type {Router, Request, Response, NextFunction} from "express";

import {db, eq, users} from "@pluteojs/database";
import {userResponseSchema} from "@pluteojs/api-types";

import {isAuthorized} from "@api/middlewares/authorizationMiddleware";
import logger from "@loaders/logger";
import expressUtil from "@util/expressUtil";
import UsersService from "@services/UsersService";
import {registry} from "@openapi/registry";
import {SuccessEnvelope, ErrorEnvelope} from "@constants/openAPIConstants";

const usersService = new UsersService();

// Register OpenAPI documentation for GET /api/v1/users/
registry.registerPath({
	method: "get",
	path: "/api/v1/users/",
	summary: "Get current user details",
	description: "Retrieves the authenticated user's profile information.",
	tags: ["Users"],
	security: [{bearerAuth: []}],
	responses: {
		200: {
			description: "User details retrieved successfully",
			content: {
				"application/json": {
					schema: SuccessEnvelope(userResponseSchema),
				},
			},
		},
		401: {
			description: "Unauthorized - Invalid or missing token",
			content: {
				"application/json": {
					schema: ErrorEnvelope,
				},
			},
		},
	},
});

/**
 * Users route handler.
 *
 * @param route - Express router
 */
export default (route: Router): void => {
	/**
	 * GET /users/
	 * Gets the current user's details.
	 * Requires authentication.
	 */
	route.get(
		"/users/",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);

			logger.debug(uniqueRequestId, "Get user details request received");

			try {
				const userId = req.user?.id;

				if (!userId) {
					throw new Error("User ID not found in session");
				}

				const data = await usersService.getUserDetails(userId);
				res.ok(data);
			} catch (error) {
				next(error);
			}
		}
	);

	/**
	 * PATCH /users/
	 * Updates the current user's profile.
	 * Requires authentication.
	 */
	route.patch(
		"/users/",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Update user profile request received");

			try {
				const userId = req.user?.id;
				if (!userId) {
					throw new Error("User ID not found in session");
				}

				const {name, image} = req.body as {
					name?: string;
					image?: string | null;
				};

				const updateData: Record<string, unknown> = {};
				if (name !== undefined) {
					updateData.name = name;
				}
				if (image !== undefined) {
					updateData.image = image;
				}

				if (Object.keys(updateData).length === 0) {
					res.fail(
						{
							error: "NoFieldsToUpdate",
							message: "No fields to update",
							details: null,
						},
						400 as never
					);
					return;
				}

				const updated = await db
					.update(users)
					.set(updateData)
					.where(eq(users.id, userId))
					.returning();

				if (updated.length === 0) {
					res.fail(
						{error: "UserNotFound", message: "User not found", details: null},
						404 as never
					);
					return;
				}

				const user = updated[0]!;
				res.ok({
					id: user.id,
					name: user.name,
					email: user.email,
					emailVerified: user.emailVerified,
					image: user.image,
					createdAt: user.createdAt?.toISOString() ?? "",
					updatedAt: user.updatedAt?.toISOString() ?? "",
				});
			} catch (error) {
				next(error);
			}
		}
	);
};
