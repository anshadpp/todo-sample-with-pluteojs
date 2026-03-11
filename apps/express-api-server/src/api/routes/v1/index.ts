import {Router} from "express";

import authRoute from "./authRoute";
import usersRoute from "./usersRoute";
import verificationRoute from "./verificationRoute";
import todosRoute from "./todosRoute";
import projectsRoute from "./projectsRoute";
import boardsRoute from "./boardsRoute";
import tasksRoute from "./tasksRoute";
import membersRoute from "./membersRoute";
import notificationsRoute from "./notificationsRoute";

/**
 * Registers all v1 API routes.
 *
 * @returns Express router with all v1 routes mounted
 */
export const registerV1Routes = (): Router => {
	const v1Router = Router();

	// Authentication routes (Better Auth)
	authRoute(v1Router);

	// User routes
	usersRoute(v1Router);

	// Verification routes
	verificationRoute(v1Router);

	// Todo routes (legacy)
	todosRoute(v1Router);

	// Project routes
	projectsRoute(v1Router);

	// Board & Category routes
	boardsRoute(v1Router);

	// Task, Comment, Label & Activity routes
	tasksRoute(v1Router);

	// Member routes
	membersRoute(v1Router);

	// Notification routes
	notificationsRoute(v1Router);

	return v1Router;
};

export default registerV1Routes;
