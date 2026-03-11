import {asTypeIResponseError} from "@customTypes/responseTypes";

export const boardsServiceError = asTypeIResponseError({
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
});
