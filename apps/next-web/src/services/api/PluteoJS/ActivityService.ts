import {AxiosInstance} from "axios";

import NetworkUtil from "@/utils/NetworkUtil";
import {APIResponse} from "@/customTypes/NetworkTypes";

import {apiEndpoints} from "./axiosConfig/AxiosServiceConstants";

interface EnvelopeResponse<T> {
	isSuccess: boolean;
	data: T;
	error: unknown;
}

function ActivityService(apiServer: AxiosInstance) {
	const getActivities = async (
		taskId: string
	): Promise<APIResponse<Record<string, unknown>[]>> => {
		let result = null;

		await apiServer
			.get(apiEndpoints.activity.list(taskId), {
				withCredentials: true,
			})
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
						data?.error || "Failed to fetch activities",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	return {
		getActivities,
	};
}

export default ActivityService;
