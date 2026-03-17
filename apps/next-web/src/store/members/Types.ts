import type {iAPIRequestStatus} from "@/customTypes/NetworkTypes";

export interface iMembersState {
	items: Record<string, unknown>[];
	fetchStatus: iAPIRequestStatus;
	updateTitleStatus: iAPIRequestStatus;
}
