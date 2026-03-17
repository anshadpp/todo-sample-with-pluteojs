import {iAPIRequestStatus} from "@/customTypes/NetworkTypes";

export const REDUCER_NAME = "autoSortRulesState";

export interface iAutoSortRulesState {
	items: Record<string, unknown>[];
	fetchStatus: iAPIRequestStatus;
	createStatus: iAPIRequestStatus;
	updateStatus: iAPIRequestStatus;
	deleteStatus: iAPIRequestStatus;
	evaluateStatus: iAPIRequestStatus;
}
