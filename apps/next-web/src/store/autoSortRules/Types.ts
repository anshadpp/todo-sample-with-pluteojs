import type {iAPIRequestStatus} from "@/customTypes/NetworkTypes";

export interface iAutoSortRulesState {
	items: Record<string, unknown>[];
	fetchStatus: iAPIRequestStatus;
	createStatus: iAPIRequestStatus;
	updateStatus: iAPIRequestStatus;
	deleteStatus: iAPIRequestStatus;
	evaluateStatus: iAPIRequestStatus;
}
