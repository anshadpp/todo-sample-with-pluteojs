import {iAPIRequestStatus} from "@/customTypes/NetworkTypes";

export const REDUCER_NAME = "tasksState";

export interface iTasksState {
	items: Record<string, unknown>[];
	selectedTask: Record<string, unknown> | null;
	fetchStatus: iAPIRequestStatus;
	createStatus: iAPIRequestStatus;
	updateStatus: iAPIRequestStatus;
	deleteStatus: iAPIRequestStatus;
	moveStatus: iAPIRequestStatus;
	reorderStatus: iAPIRequestStatus;
	getTaskStatus: iAPIRequestStatus;
}
