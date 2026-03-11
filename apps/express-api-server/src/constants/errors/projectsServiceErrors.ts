import {asTypeIResponseError} from "@customTypes/responseTypes";

export const projectsServiceError = asTypeIResponseError({
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
});
