import {AxiosInstance} from "axios";

import NetworkUtil from "@/utils/NetworkUtil";
import {APIResponse} from "@/customTypes/NetworkTypes";

import {apiEndpoints} from "./axiosConfig/AxiosServiceConstants";

interface EnvelopeResponse<T> {
	isSuccess: boolean;
	data: T;
	error: unknown;
}

function CommentService(apiServer: AxiosInstance) {
	const getComments = async (
		taskId: string
	): Promise<APIResponse<Record<string, unknown>[]>> => {
		let result = null;

		await apiServer
			.get(apiEndpoints.comments.list(taskId), {
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
						data?.error || "Failed to fetch comments",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const createComment = async (
		taskId: string,
		data: Record<string, unknown>
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(apiEndpoints.comments.create(taskId), data, {
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
						data?.error || "Failed to create comment",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const updateComment = async (
		taskId: string,
		commentId: string,
		data: Record<string, unknown>
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.patch(apiEndpoints.comments.update(taskId, commentId), data, {
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
						data?.error || "Failed to update comment",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const deleteComment = async (
		taskId: string,
		commentId: string
	): Promise<APIResponse<null>> => {
		let result = null;

		await apiServer
			.delete(apiEndpoints.comments.delete(taskId, commentId), {
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
						data?.error || "Failed to delete comment",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	return {
		getComments,
		createComment,
		updateComment,
		deleteComment,
	};
}

export default CommentService;
