import {iAPIRequestStatus} from "@/customTypes/NetworkTypes";

export const REDUCER_NAME = "notificationsState";

export interface iNotificationsState {
	items: Record<string, unknown>[];
	unreadCount: number;
	fetchStatus: iAPIRequestStatus;
	fetchUnreadCountStatus: iAPIRequestStatus;
	markAsReadStatus: iAPIRequestStatus;
	markAllAsReadStatus: iAPIRequestStatus;
}
