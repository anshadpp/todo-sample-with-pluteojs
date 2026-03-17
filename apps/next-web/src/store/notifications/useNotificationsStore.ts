import {create} from "zustand";
import {devtools} from "zustand/middleware";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {notificationService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPendingImm,
	setFulfilledImm,
	setRejectedImm,
} from "../common/RequestStatusHelpers";
import type {iNotificationsState} from "./Types";

interface NotificationsStore extends iNotificationsState {
	fetchNotifications: () => Promise<void>;
	fetchUnreadCount: () => Promise<void>;
	markAsRead: (notificationId: string) => Promise<void>;
	markAllAsRead: () => Promise<void>;
	resetNotificationsState: () => void;
}

const initialState: iNotificationsState = {
	items: [],
	unreadCount: 0,
	fetchStatus: {...initialRequestStatus},
	fetchUnreadCountStatus: {...initialRequestStatus},
	markAsReadStatus: {...initialRequestStatus},
	markAllAsReadStatus: {...initialRequestStatus},
};

export const useNotificationsStore = create<NotificationsStore>()(
	devtools(
		(set) => ({
			...initialState,

			fetchNotifications: async () => {
				set({fetchStatus: setPendingImm()});
				const result = await notificationService.getNotifications();
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						items: (result.data?.data as Record<string, unknown>[]) ?? [],
						fetchStatus: setFulfilledImm(),
					});
				} else {
					set({
						fetchStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			fetchUnreadCount: async () => {
				set({fetchUnreadCountStatus: setPendingImm()});
				const result = await notificationService.getUnreadCount();
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						unreadCount:
							(result.data?.data as {count: number} | number | null) !== null
								? typeof result.data?.data === "number"
									? result.data.data
									: ((result.data?.data as {count?: number})?.count ?? 0)
								: 0,
						fetchUnreadCountStatus: setFulfilledImm(),
					});
				} else {
					set({
						fetchUnreadCountStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			markAsRead: async (notificationId) => {
				set({markAsReadStatus: setPendingImm()});
				const result = await notificationService.markAsRead(notificationId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({markAsReadStatus: setFulfilledImm()});
				} else {
					set({
						markAsReadStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			markAllAsRead: async () => {
				set({markAllAsReadStatus: setPendingImm()});
				const result = await notificationService.markAllAsRead();
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						markAllAsReadStatus: setFulfilledImm(),
						unreadCount: 0,
					});
				} else {
					set({
						markAllAsReadStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			resetNotificationsState: () => set({...initialState}),
		}),
		{name: "notificationsStore"}
	)
);
