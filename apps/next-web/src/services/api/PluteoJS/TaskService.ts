import {AxiosInstance} from "axios";

import NetworkUtil from "@/utils/NetworkUtil";
import {APIResponse} from "@/customTypes/NetworkTypes";

import {apiEndpoints} from "./axiosConfig/AxiosServiceConstants";

interface EnvelopeResponse<T> {
	isSuccess: boolean;
	data: T;
	error: unknown;
}

function TaskService(apiServer: AxiosInstance) {
	const getTasks = async (
		projectId: string
	): Promise<APIResponse<Record<string, unknown>[]>> => {
		let result = null;

		await apiServer
			.get(apiEndpoints.tasks.listByProject(projectId), {
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
						data?.error || "Failed to fetch tasks",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const createTask = async (
		projectId: string,
		data: Record<string, unknown>
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(apiEndpoints.tasks.create(projectId), data, {
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
						data?.error || "Failed to create task",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const getTask = async (
		taskId: string
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.get(apiEndpoints.tasks.get(taskId), {withCredentials: true})
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
						data?.error || "Failed to fetch task",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const updateTask = async (
		taskId: string,
		data: Record<string, unknown>
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.patch(apiEndpoints.tasks.update(taskId), data, {
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
						data?.error || "Failed to update task",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const moveTask = async (
		taskId: string,
		data: Record<string, unknown>
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(apiEndpoints.tasks.move(taskId), data, {
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
						data?.error || "Failed to move task",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const reorderTasks = async (
		tasks: Record<string, unknown>[]
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(apiEndpoints.tasks.reorder(), {tasks}, {withCredentials: true})
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
						data?.error || "Failed to reorder tasks",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const deleteTask = async (taskId: string): Promise<APIResponse<null>> => {
		let result = null;

		await apiServer
			.delete(apiEndpoints.tasks.delete(taskId), {
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
						data?.error || "Failed to delete task",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const getDependencies = async (
		taskId: string
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.get(apiEndpoints.tasks.dependencies(taskId), {withCredentials: true})
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
						data?.error || "Failed to fetch dependencies",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const addDependency = async (
		taskId: string,
		dependsOnTaskId: string,
		dependencyType: string = "blocks"
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(
				apiEndpoints.tasks.dependencies(taskId),
				{dependsOnTaskId, dependencyType},
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
						data?.error || "Failed to add dependency",
						status || 500,
						data?.message || null,
						null
					);
				}
			);

		return result!;
	};

	const removeDependency = async (
		taskId: string,
		dependencyId: string
	): Promise<APIResponse<null>> => {
		let result = null;

		await apiServer
			.delete(apiEndpoints.tasks.removeDependency(taskId, dependencyId), {
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
						data?.error || "Failed to remove dependency",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	return {
		getTasks,
		createTask,
		getTask,
		updateTask,
		moveTask,
		reorderTasks,
		deleteTask,
		getDependencies,
		addDependency,
		removeDependency,
	};
}

export default TaskService;
