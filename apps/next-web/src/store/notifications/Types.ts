import type {iAPIRequestStatus} from "@/customTypes/NetworkTypes";

export interface iNotificationsState {
	items: Record<string, unknown>[];
	unreadCount: number;
	fetchStatus: iAPIRequestStatus;
	fetchUnreadCountStatus: iAPIRequestStatus;
	markAsReadStatus: iAPIRequestStatus;
	markAllAsReadStatus: iAPIRequestStatus;
}
