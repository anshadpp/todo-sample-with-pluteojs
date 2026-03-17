import {iAPIRequestStatus} from "@/customTypes/NetworkTypes";

export const REDUCER_NAME = "membersState";

export interface iMembersState {
	items: Record<string, unknown>[];
	fetchStatus: iAPIRequestStatus;
	updateTitleStatus: iAPIRequestStatus;
}
