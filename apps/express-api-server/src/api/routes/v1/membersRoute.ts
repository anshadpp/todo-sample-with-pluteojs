import type {Router, Request, Response, NextFunction} from "express";

import {db, eq, and, members, users} from "@pluteojs/database";

import {isAuthorized} from "@api/middlewares/authorizationMiddleware";
import logger from "@loaders/logger";
import expressUtil from "@util/expressUtil";

export default (route: Router): void => {
	// GET /members/ - List organization members
	route.get(
		"/members/",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(
				uniqueRequestId,
				"List organization members request received"
			);
			try {
				const organizationId = req.headers["x-organization-id"] as string;
				if (!organizationId) {
					throw new Error("Organization ID is required");
				}

				const records = await db
					.select({
						id: members.id,
						userId: members.userId,
						name: users.name,
						email: users.email,
						image: users.image,
						role: members.role,
						title: members.title,
					})
					.from(members)
					.innerJoin(users, eq(members.userId, users.id))
					.where(eq(members.organizationId, organizationId));

				res.ok(records);
			} catch (error) {
				next(error);
			}
		}
	);

	// PATCH /members/:memberId/title - Update member title
	route.patch(
		"/members/:memberId/title",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "Update member title request received");
			try {
				const organizationId = req.headers["x-organization-id"] as string;
				if (!organizationId) {
					throw new Error("Organization ID is required");
				}

				const memberId = req.params.memberId as string;
				const {title} = req.body as {title: string | null};

				if (!memberId) {
					res.fail(
						{
							error: "MissingMemberId",
							message: "Member ID is required",
							details: null,
						},
						400 as never
					);
					return;
				}

				const updated = await db
					.update(members)
					.set({title: title ?? null})
					.where(
						and(
							eq(members.id, memberId),
							eq(members.organizationId, organizationId)
						)
					)
					.returning();

				if (updated.length === 0) {
					res.fail(
						{
							error: "MemberNotFound",
							message: "Member not found",
							details: null,
						},
						404 as never
					);
					return;
				}

				res.ok(updated[0]);
			} catch (error) {
				next(error);
			}
		}
	);
};
