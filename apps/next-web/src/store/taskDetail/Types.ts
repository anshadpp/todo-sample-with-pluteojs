import {iAPIRequestStatus} from "@/customTypes/NetworkTypes";

export const REDUCER_NAME = "taskDetailState";

export interface iTaskDetailState {
	comments: Record<string, unknown>[];
	activities: Record<string, unknown>[];
	dependencies: Record<string, unknown> | null;
	fetchCommentsStatus: iAPIRequestStatus;
	createCommentStatus: iAPIRequestStatus;
	updateCommentStatus: iAPIRequestStatus;
	deleteCommentStatus: iAPIRequestStatus;
	fetchActivitiesStatus: iAPIRequestStatus;
	fetchDependenciesStatus: iAPIRequestStatus;
	addDependencyStatus: iAPIRequestStatus;
	removeDependencyStatus: iAPIRequestStatus;
}
