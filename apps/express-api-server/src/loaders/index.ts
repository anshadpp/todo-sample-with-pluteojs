import type express from "express";

import Logger from "@loaders/logger";
import loadExpress from "@loaders/expressLoader";
import loadBetterAuth from "@loaders/betterAuthLoader";
import {loadOpenApi} from "@loaders/openApiLoader";
import TodoNotifierService from "@services/TodoNotifierService";

const loader = async ({
	expressApp,
}: {
	expressApp: express.Application;
}): Promise<void> => {
	// Configure better-auth email handlers before loading express routes
	loadBetterAuth();

	// Load OpenAPI documentation (dev only, before routes)
	await loadOpenApi(expressApp);

	// loading express...
	await loadExpress({app: expressApp});
	Logger.loggerInstance.info("Express loaded");

	// Start the todo notification service
	const todoNotifier = new TodoNotifierService();
	todoNotifier.start();
};

export default loader;
