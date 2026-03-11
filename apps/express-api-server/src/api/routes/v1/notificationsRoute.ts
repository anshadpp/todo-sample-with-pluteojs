import type {Router, Request, Response, NextFunction} from "express";

import {
	notificationListResponseSchema,
	unreadCountResponseSchema,
} from "@pluteojs/api-types";

import {isAuthorized} from "@api/middlewares/authorizationMiddleware";
import logger from "@loaders/logger";
import expressUtil from "@util/expressUtil";
import NotificationsService from "@services/NotificationsService";
import {registry} from "@openapi/registry";
import {SuccessEnvelope, ErrorEnvelope} from "@constants/openAPIConstants";

const notificationsService = new NotificationsService();

registry.registerPath({
	method: "get",
	path: "/api/v1/notifications/",
	summary: "List notifications",
	tags: ["Notifications"],
	security: [{bearerAuth: []}],
	responses: {
		200: {description: "Notifications retrieved", content: {"application/json": {schema: SuccessEnvelope(notificationListResponseSchema)}}},
	},
});

registry.registerPath({
	method: "get",
	path: "/api/v1/notifications/unread-count",
	summary: "Get unread notification count",
	tags: ["Notifications"],
	security: [{bearerAuth: []}],
	responses: {
		200: {description: "Unread count", content: {"application/json": {schema: SuccessEnvelope(unreadCountResponseSchema)}}},
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/notifications/{notificationId}/read",
	summary: "Mark notification as read",
	tags: ["Notifications"],
	security: [{bearerAuth: []}],
	responses: {
		200: {description: "Notification marked as read"},
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/notifications/read-all",
	summary: "Mark all notifications as read",
	tags: ["Notifications"],
	security: [{bearerAuth: []}],
	responses: {
		200: {description: "All notifications marked as read"},
	},
});

export default (route: Router): void => {
	route.get(
		"/notifications/",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			const uniqueRequestId = expressUtil.parseUniqueRequestId(req);
			logger.debug(uniqueRequestId, "List notifications request received");
			try {
				const userId = req.user?.id;
				if (!userId) {throw new Error("User ID not found in session");}

				const data = await notificationsService.getNotifications(userId);
				res.ok(data);
			} catch (error) { next(error); }
		},
	);

	route.get(
		"/notifications/unread-count",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const userId = req.user?.id;
				if (!userId) {throw new Error("User ID not found in session");}

				const count = await notificationsService.getUnreadCount(userId);
				res.ok({count});
			} catch (error) { next(error); }
		},
	);

	route.patch(
		"/notifications/read-all",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const userId = req.user?.id;
				if (!userId) {throw new Error("User ID not found in session");}

				await notificationsService.markAllAsRead(userId);
				res.ok({message: "All notifications marked as read"});
			} catch (error) { next(error); }
		},
	);

	route.patch(
		"/notifications/:notificationId/read",
		isAuthorized,
		async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const userId = req.user?.id;
				if (!userId) {throw new Error("User ID not found in session");}

				await notificationsService.markAsRead(req.params.notificationId!, userId);
				res.ok({message: "Notification marked as read"});
			} catch (error) { next(error); }
		},
	);
};
