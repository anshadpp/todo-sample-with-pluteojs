import {AxiosInstance} from "axios";

import NetworkUtil from "@/utils/NetworkUtil";
import {APIResponse} from "@/customTypes/NetworkTypes";

import {apiEndpoints} from "./axiosConfig/AxiosServiceConstants";

interface EnvelopeResponse<T> {
	isSuccess: boolean;
	data: T;
	error: unknown;
}

function NotificationService(apiServer: AxiosInstance) {
	const getNotifications = async (): Promise<
		APIResponse<Record<string, unknown>[]>
	> => {
		let result = null;

		await apiServer
			.get(apiEndpoints.notifications.list(), {withCredentials: true})
			.then(
				(value) => {
					const envelope = value.data as EnvelopeResponse<
						Record<string, unknown>[]
					>;
					result = NetworkUtil.buildResult<Record<string, unknown>[]>(
						null,
						value.status,
						null,
						envelope.data as unknown as null
					);
				},
				(reason) => {
					const {response} = reason;
					const {status, data} = response || {};
					result = NetworkUtil.buildResult<null>(
						data?.error || "Failed to fetch notifications",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const getUnreadCount = async (): Promise<
		APIResponse<Record<string, unknown>>
	> => {
		let result = null;

		await apiServer
			.get(apiEndpoints.notifications.unreadCount(), {
				withCredentials: true,
			})
			.then(
				(value) => {
					const envelope = value.data as EnvelopeResponse<
						Record<string, unknown>
					>;
					result = NetworkUtil.buildResult<Record<string, unknown>>(
						null,
						value.status,
						null,
						envelope.data as unknown as null
					);
				},
				(reason) => {
					const {response} = reason;
					const {status, data} = response || {};
					result = NetworkUtil.buildResult<null>(
						data?.error || "Failed to fetch unread count",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const markAsRead = async (
		id: string
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(
				apiEndpoints.notifications.markRead(id),
				{},
				{
					withCredentials: true,
				}
			)
			.then(
				(value) => {
					const envelope = value.data as EnvelopeResponse<
						Record<string, unknown>
					>;
					result = NetworkUtil.buildResult<Record<string, unknown>>(
						null,
						value.status,
						null,
						envelope.data as unknown as null
					);
				},
				(reason) => {
					const {response} = reason;
					const {status, data} = response || {};
					result = NetworkUtil.buildResult<null>(
						data?.error || "Failed to mark notification as read",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const markAllAsRead = async (): Promise<
		APIResponse<Record<string, unknown>>
	> => {
		let result = null;

		await apiServer
			.post(
				apiEndpoints.notifications.markAllRead(),
				{},
				{
					withCredentials: true,
				}
			)
			.then(
				(value) => {
					const envelope = value.data as EnvelopeResponse<
						Record<string, unknown>
					>;
					result = NetworkUtil.buildResult<Record<string, unknown>>(
						null,
						value.status,
						null,
						envelope.data as unknown as null
					);
				},
				(reason) => {
					const {response} = reason;
					const {status, data} = response || {};
					result = NetworkUtil.buildResult<null>(
						data?.error || "Failed to mark all notifications as read",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	return {
		getNotifications,
		getUnreadCount,
		markAsRead,
		markAllAsRead,
	};
}

export default NotificationService;
