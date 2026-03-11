import {AxiosInstance} from "axios";

import NetworkUtil from "@/utils/NetworkUtil";
import {APIResponse} from "@/customTypes/NetworkTypes";

import {apiEndpoints} from "./axiosConfig/AxiosServiceConstants";

interface EnvelopeResponse<T> {
	isSuccess: boolean;
	data: T;
	error: unknown;
}

function BoardService(apiServer: AxiosInstance) {
	const getBoards = async (
		projectId: string
	): Promise<APIResponse<Record<string, unknown>[]>> => {
		let result = null;

		await apiServer
			.get(apiEndpoints.boards.listByProject(projectId), {
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
						data?.error || "Failed to fetch boards",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const createBoard = async (
		projectId: string,
		data: Record<string, unknown>
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(apiEndpoints.boards.create(projectId), data, {
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
						data?.error || "Failed to create board",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const getBoard = async (
		boardId: string
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.get(apiEndpoints.boards.get(boardId), {withCredentials: true})
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
						data?.error || "Failed to fetch board",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const updateBoard = async (
		boardId: string,
		data: Record<string, unknown>
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.patch(apiEndpoints.boards.update(boardId), data, {
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
						data?.error || "Failed to update board",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const deleteBoard = async (boardId: string): Promise<APIResponse<null>> => {
		let result = null;

		await apiServer
			.delete(apiEndpoints.boards.delete(boardId), {
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
						data?.error || "Failed to delete board",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const getCategories = async (
		boardId: string
	): Promise<APIResponse<Record<string, unknown>[]>> => {
		let result = null;

		await apiServer
			.get(apiEndpoints.categories.list(boardId), {
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
						data?.error || "Failed to fetch categories",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const createCategory = async (
		boardId: string,
		data: Record<string, unknown>
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(apiEndpoints.categories.create(boardId), data, {
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
						data?.error || "Failed to create category",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const updateCategory = async (
		boardId: string,
		categoryId: string,
		data: Record<string, unknown>
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.patch(apiEndpoints.categories.update(boardId, categoryId), data, {
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
						data?.error || "Failed to update category",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const deleteCategory = async (
		boardId: string,
		categoryId: string
	): Promise<APIResponse<null>> => {
		let result = null;

		await apiServer
			.delete(apiEndpoints.categories.delete(boardId, categoryId), {
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
						data?.error || "Failed to delete category",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const reorderCategories = async (
		boardId: string,
		items: Record<string, unknown>[]
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(
				apiEndpoints.categories.reorder(boardId),
				{items},
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
						data?.error || "Failed to reorder categories",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	return {
		getBoards,
		createBoard,
		getBoard,
		updateBoard,
		deleteBoard,
		getCategories,
		createCategory,
		updateCategory,
		deleteCategory,
		reorderCategories,
	};
}

export default BoardService;
