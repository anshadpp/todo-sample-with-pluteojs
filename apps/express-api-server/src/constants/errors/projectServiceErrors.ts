import {asTypeIResponseError} from "@customTypes/responseTypes";

export const projectServiceError = asTypeIResponseError({
	getProject: {
		ProjectNotFound: {
			error: "ProjectNotFound",
			message: "Project not found",
			details: null,
		},
	},
	updateProject: {
		ProjectNotFound: {
			error: "ProjectNotFound",
			message: "Project not found",
			details: null,
		},
	},
	deleteProject: {
		ProjectNotFound: {
			error: "ProjectNotFound",
			message: "Project not found",
			details: null,
		},
	},
	getBoard: {
		BoardNotFound: {
			error: "BoardNotFound",
			message: "Board not found",
			details: null,
		},
	},
	updateBoard: {
		BoardNotFound: {
			error: "BoardNotFound",
			message: "Board not found",
			details: null,
		},
	},
	deleteBoard: {
		BoardNotFound: {
			error: "BoardNotFound",
			message: "Board not found",
			details: null,
		},
	},
	getCategory: {
		CategoryNotFound: {
			error: "CategoryNotFound",
			message: "Category not found",
			details: null,
		},
	},
	updateCategory: {
		CategoryNotFound: {
			error: "CategoryNotFound",
			message: "Category not found",
			details: null,
		},
	},
	deleteCategory: {
		CategoryNotFound: {
			error: "CategoryNotFound",
			message: "Category not found",
			details: null,
		},
	},
});
