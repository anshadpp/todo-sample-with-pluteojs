import {asTypeIResponseError} from "@customTypes/responseTypes";

export const todosServiceError = asTypeIResponseError({
	getTodo: {
		TodoNotFound: {
			error: "TodoNotFound",
			message: "Todo not found",
			details: null,
		},
	},
	updateTodo: {
		TodoNotFound: {
			error: "TodoNotFound",
			message: "Todo not found",
			details: null,
		},
	},
	deleteTodo: {
		TodoNotFound: {
			error: "TodoNotFound",
			message: "Todo not found",
			details: null,
		},
	},
});
