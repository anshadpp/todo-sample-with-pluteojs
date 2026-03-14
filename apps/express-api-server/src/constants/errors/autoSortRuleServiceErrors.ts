import {asTypeIResponseError} from "@customTypes/responseTypes";

export const autoSortRuleServiceError = asTypeIResponseError({
	getRule: {
		RuleNotFound: {
			error: "RuleNotFound",
			message: "Auto-sort rule not found",
			details: null,
		},
	},
	updateRule: {
		RuleNotFound: {
			error: "RuleNotFound",
			message: "Auto-sort rule not found",
			details: null,
		},
	},
	deleteRule: {
		RuleNotFound: {
			error: "RuleNotFound",
			message: "Auto-sort rule not found",
			details: null,
		},
	},
});
