import type {iAPIRequestStatus} from "@/customTypes/NetworkTypes";

export interface iLabelsState {
	items: Record<string, unknown>[];
	fetchStatus: iAPIRequestStatus;
	createStatus: iAPIRequestStatus;
	addLabelStatus: iAPIRequestStatus;
	removeLabelStatus: iAPIRequestStatus;
}
