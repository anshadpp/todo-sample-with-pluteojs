import {iAPIRequestStatus} from "@/customTypes/NetworkTypes";

export interface iOrganizationState {
	organizations: Record<string, unknown>[];
	activeOrganizationId: string | null;
	activeOrganization: Record<string, unknown> | null;
	fetchStatus: iAPIRequestStatus;
	createStatus: iAPIRequestStatus;
	updateStatus: iAPIRequestStatus;
	deleteStatus: iAPIRequestStatus;
	setActiveStatus: iAPIRequestStatus;
	inviteStatus: iAPIRequestStatus;
	acceptInvitationStatus: iAPIRequestStatus;
	rejectInvitationStatus: iAPIRequestStatus;
}
