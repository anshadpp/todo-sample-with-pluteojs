import {iAPIRequestStatus} from "@/customTypes/NetworkTypes";

export interface iBoardsState {
	items: Record<string, unknown>[];
	selectedBoard: Record<string, unknown> | null;
	categories: Record<string, unknown>[];
	fetchStatus: iAPIRequestStatus;
	createStatus: iAPIRequestStatus;
	updateStatus: iAPIRequestStatus;
	deleteStatus: iAPIRequestStatus;
	fetchCategoriesStatus: iAPIRequestStatus;
	createCategoryStatus: iAPIRequestStatus;
	updateCategoryStatus: iAPIRequestStatus;
	deleteCategoryStatus: iAPIRequestStatus;
	reorderCategoriesStatus: iAPIRequestStatus;
}
