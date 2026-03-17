import type {iAPIRequestStatus} from "@/customTypes/NetworkTypes";

export interface iUserState {
	profile: Record<string, unknown> | null;
	fetchStatus: iAPIRequestStatus;
	updateStatus: iAPIRequestStatus;
}
