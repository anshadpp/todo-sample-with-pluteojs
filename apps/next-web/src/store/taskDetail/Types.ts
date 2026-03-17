import type {iAPIRequestStatus} from "@/customTypes/NetworkTypes";

export interface iTaskDetailState {
	comments: Record<string, unknown>[];
	activities: Record<string, unknown>[];
	dependencies: Record<string, unknown>[];
	fetchCommentsStatus: iAPIRequestStatus;
	createCommentStatus: iAPIRequestStatus;
	updateCommentStatus: iAPIRequestStatus;
	deleteCommentStatus: iAPIRequestStatus;
	fetchActivitiesStatus: iAPIRequestStatus;
	fetchDependenciesStatus: iAPIRequestStatus;
	addDependencyStatus: iAPIRequestStatus;
	removeDependencyStatus: iAPIRequestStatus;
}
