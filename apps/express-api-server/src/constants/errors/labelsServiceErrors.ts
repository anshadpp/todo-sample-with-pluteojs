import {asTypeIResponseError} from "@customTypes/responseTypes";

export const labelsServiceError = asTypeIResponseError({
	getLabel: {
		LabelNotFound: {
			error: "LabelNotFound",
			message: "Label not found",
			details: null,
		},
	},
	updateLabel: {
		LabelNotFound: {
			error: "LabelNotFound",
			message: "Label not found",
			details: null,
		},
	},
	deleteLabel: {
		LabelNotFound: {
			error: "LabelNotFound",
			message: "Label not found",
			details: null,
		},
	},
});
