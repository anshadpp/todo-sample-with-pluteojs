import {asTypeIResponseError} from "@customTypes/responseTypes";

export const tasksServiceError = asTypeIResponseError({
	getTask: {
		TaskNotFound: {
			error: "TaskNotFound",
			message: "Task not found",
			details: null,
		},
	},
	updateTask: {
		TaskNotFound: {
			error: "TaskNotFound",
			message: "Task not found",
			details: null,
		},
	},
	deleteTask: {
		TaskNotFound: {
			error: "TaskNotFound",
			message: "Task not found",
			details: null,
		},
	},
	moveTask: {
		TaskNotFound: {
			error: "TaskNotFound",
			message: "Task not found",
			details: null,
		},
	},
});
