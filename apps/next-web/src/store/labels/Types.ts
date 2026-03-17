import {iAPIRequestStatus} from "@/customTypes/NetworkTypes";

export const REDUCER_NAME = "labelsState";

export interface iLabelsState {
	items: Record<string, unknown>[];
	fetchStatus: iAPIRequestStatus;
	createStatus: iAPIRequestStatus;
	addToTaskStatus: iAPIRequestStatus;
	removeFromTaskStatus: iAPIRequestStatus;
}
