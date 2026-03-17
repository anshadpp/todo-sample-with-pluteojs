import {iAPIRequestStatus} from "@/customTypes/NetworkTypes";

export const REDUCER_NAME = "userState";

export interface iUserState {
	profile: Record<string, unknown> | null;
	fetchProfileStatus: iAPIRequestStatus;
	updateProfileStatus: iAPIRequestStatus;
}
