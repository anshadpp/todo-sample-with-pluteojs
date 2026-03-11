import {AxiosRequestConfig} from "axios";

/**
 * The base url of the api server's endpoint needs to be configured here.
 *
 * NOTE: This has to be managed by a build flavor configuration files
 * such as environment files or via a remote configuration manager.
 */
const API_SERVER_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3020";

/**
 * The request timeout of the api server needs to be configured here.
 *
 * NOTE: This has to be managed by a build flavor configuration files
 * such as environment files or via a remote configuration manager.
 */
const API_SERVER_REQUEST_TIMEOUT = Number(
	process.env.NEXT_PUBLIC_API_TIMEOUT || 15000
);

/**
 * All basic axios request-configurations needs to be set here.
 * This will used inside the services/api/index.ts file while
 * creating axios service instance to handle api calls.
 */
export const axiosRequestConfig: AxiosRequestConfig =
	Object.freeze<AxiosRequestConfig>({
		withCredentials: true,
		baseURL: API_SERVER_BASE_URL,

		/**
		 * The timeout for axios is set in milliseconds.
		 * Here, it's set to 15 seconds (15000ms) as the default value if
		 * the API_SERVER_REQUEST_TIMEOUT is not set in the
		 * environment files.
		 */
		timeout: API_SERVER_REQUEST_TIMEOUT || 15000,
	});

/**
 * All the application service api endpoints should be defined here and never
 * directly define and use apiEndpoints as the baseURL is configured based on
 * the build flavor or other remote configuration managers.
 *
 * While defining endpoints here, kindly note that the part after the base url
 * should be added here and shouldn't include the host/baseURL part.
 *
 * Kindly refer the below examples for more details:
 *
 * If the endpoint is "https://dev.exampleapiserver.tld/api/v1/login" , then it
 * should be split as below:
 * API_SERVER_BASE_URL =  "https://dev.exampleapiserver.tld/api/v1"
 * apiEndpoints = {
 *     authentication: {
 *         login: "/login"
 *     }
 * }
 *
 */
export const apiEndpoints = Object.freeze({
	health: {
		check: () => "/health",
	},
	example: {
		getDetails: () => "/api/example",
	},
	auth: {
		signIn: () => "/api/v1/auth/sign-in/email",
		signUp: () => "/api/v1/auth/sign-up/email",
		signOut: () => "/api/v1/auth/sign-out",
		getSession: () => "/api/v1/auth/get-session",
	},
	todos: {
		list: () => "/api/v1/todos/",
		create: () => "/api/v1/todos/",
		update: (id: string) => `/api/v1/todos/${id}`,
		delete: (id: string) => `/api/v1/todos/${id}`,
	},
	organizations: {
		create: () => "/api/v1/auth/organization/create",
		list: () => "/api/v1/auth/organization/list",
		setActive: () => "/api/v1/auth/organization/set-active",
		getFullOrg: (orgId: string) =>
			`/api/v1/auth/organization/get-full-organization?organizationId=${orgId}`,
		update: () => "/api/v1/auth/organization/update",
		delete: () => "/api/v1/auth/organization/delete",
		inviteMember: () => "/api/v1/auth/organization/invite-member",
		acceptInvitation: () => "/api/v1/auth/organization/accept-invitation",
		rejectInvitation: () => "/api/v1/auth/organization/reject-invitation",
		cancelInvitation: () => "/api/v1/auth/organization/cancel-invitation",
		getInvitation: (invitationId: string) =>
			`/api/v1/auth/organization/get-invitation?id=${invitationId}`,
		removeMember: () => "/api/v1/auth/organization/remove-member",
		updateMemberRole: () => "/api/v1/auth/organization/update-member-role",
	},
	projects: {
		list: () => "/api/v1/projects/",
		create: () => "/api/v1/projects/",
		get: (id: string) => `/api/v1/projects/${id}`,
		update: (id: string) => `/api/v1/projects/${id}`,
		delete: (id: string) => `/api/v1/projects/${id}`,
	},
	boards: {
		listByProject: (projectId: string) =>
			`/api/v1/projects/${projectId}/boards/`,
		create: (projectId: string) => `/api/v1/projects/${projectId}/boards/`,
		get: (boardId: string) => `/api/v1/boards/${boardId}`,
		update: (boardId: string) => `/api/v1/boards/${boardId}`,
		delete: (boardId: string) => `/api/v1/boards/${boardId}`,
	},
	categories: {
		list: (boardId: string) => `/api/v1/boards/${boardId}/categories/`,
		create: (boardId: string) => `/api/v1/boards/${boardId}/categories/`,
		update: (boardId: string, categoryId: string) =>
			`/api/v1/boards/${boardId}/categories/${categoryId}`,
		delete: (boardId: string, categoryId: string) =>
			`/api/v1/boards/${boardId}/categories/${categoryId}`,
		reorder: (boardId: string) =>
			`/api/v1/boards/${boardId}/categories/reorder`,
	},
	tasks: {
		listByProject: (projectId: string) =>
			`/api/v1/projects/${projectId}/tasks/`,
		create: (projectId: string) => `/api/v1/projects/${projectId}/tasks/`,
		get: (taskId: string) => `/api/v1/tasks/${taskId}`,
		update: (taskId: string) => `/api/v1/tasks/${taskId}`,
		move: (taskId: string) => `/api/v1/tasks/${taskId}/move`,
		reorder: () => "/api/v1/tasks/reorder",
		delete: (taskId: string) => `/api/v1/tasks/${taskId}`,
		dependencies: (taskId: string) => `/api/v1/tasks/${taskId}/dependencies/`,
		removeDependency: (taskId: string, depId: string) =>
			`/api/v1/tasks/${taskId}/dependencies/${depId}`,
	},
	comments: {
		list: (taskId: string) => `/api/v1/tasks/${taskId}/comments/`,
		create: (taskId: string) => `/api/v1/tasks/${taskId}/comments/`,
		update: (taskId: string, commentId: string) =>
			`/api/v1/tasks/${taskId}/comments/${commentId}`,
		delete: (taskId: string, commentId: string) =>
			`/api/v1/tasks/${taskId}/comments/${commentId}`,
	},
	labels: {
		list: (projectId: string) => `/api/v1/projects/${projectId}/labels/`,
		create: (projectId: string) => `/api/v1/projects/${projectId}/labels/`,
		addToTask: (taskId: string, labelId: string) =>
			`/api/v1/tasks/${taskId}/labels/${labelId}`,
		removeFromTask: (taskId: string, labelId: string) =>
			`/api/v1/tasks/${taskId}/labels/${labelId}`,
	},
	activity: {
		list: (taskId: string) => `/api/v1/tasks/${taskId}/activity/`,
	},
	members: {
		list: () => "/api/v1/members/",
		updateTitle: (memberId: string) => `/api/v1/members/${memberId}/title`,
	},
	users: {
		get: () => "/api/v1/users/",
		update: () => "/api/v1/users/",
	},
	notifications: {
		list: () => "/api/v1/notifications/",
		unreadCount: () => "/api/v1/notifications/unread-count",
		markRead: (id: string) => `/api/v1/notifications/${id}/read`,
		markAllRead: () => "/api/v1/notifications/read-all",
	},
});
