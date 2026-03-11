import {asTypeIResponseError} from "@customTypes/responseTypes";

export const categoriesServiceError = asTypeIResponseError({
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
