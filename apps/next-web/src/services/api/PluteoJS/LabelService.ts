import {AxiosInstance} from "axios";

import NetworkUtil from "@/utils/NetworkUtil";
import {APIResponse} from "@/customTypes/NetworkTypes";

import {apiEndpoints} from "./axiosConfig/AxiosServiceConstants";

interface EnvelopeResponse<T> {
	isSuccess: boolean;
	data: T;
	error: unknown;
}

function LabelService(apiServer: AxiosInstance) {
	const getLabels = async (
		projectId: string
	): Promise<APIResponse<Record<string, unknown>[]>> => {
		let result = null;

		await apiServer
			.get(apiEndpoints.labels.list(projectId), {
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
						data?.error || "Failed to fetch labels",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const createLabel = async (
		projectId: string,
		data: Record<string, unknown>
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(apiEndpoints.labels.create(projectId), data, {
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
						data?.error || "Failed to create label",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const addLabelToTask = async (
		taskId: string,
		labelId: string
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(
				apiEndpoints.labels.addToTask(taskId, labelId),
				{},
				{withCredentials: true}
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
						data?.error || "Failed to add label to task",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const removeLabelFromTask = async (
		taskId: string,
		labelId: string
	): Promise<APIResponse<null>> => {
		let result = null;

		await apiServer
			.delete(apiEndpoints.labels.removeFromTask(taskId, labelId), {
				withCredentials: true,
			})
			.then(
				(value) => {
					result = NetworkUtil.buildResult<null>(
						null,
						value.status,
						null,
						null
					);
				},
				(reason) => {
					const {response} = reason;
					const {status, data} = response || {};
					result = NetworkUtil.buildResult<null>(
						data?.error || "Failed to remove label from task",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	return {
		getLabels,
		createLabel,
		addLabelToTask,
		removeLabelFromTask,
	};
}

export default LabelService;
