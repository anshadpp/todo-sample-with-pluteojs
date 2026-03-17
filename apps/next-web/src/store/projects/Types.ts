import {iAPIRequestStatus} from "@/customTypes/NetworkTypes";

export interface iProjectsState {
	items: Record<string, unknown>[];
	selectedProject: Record<string, unknown> | null;
	fetchStatus: iAPIRequestStatus;
	createStatus: iAPIRequestStatus;
	updateStatus: iAPIRequestStatus;
	deleteStatus: iAPIRequestStatus;
	getProjectStatus: iAPIRequestStatus;
}
