import {AxiosInstance} from "axios";

import NetworkUtil from "@/utils/NetworkUtil";
import {APIResponse} from "@/customTypes/NetworkTypes";

import {apiEndpoints} from "./axiosConfig/AxiosServiceConstants";

interface EnvelopeResponse<T> {
	isSuccess: boolean;
	data: T;
	error: unknown;
}

function getHeaders(orgId?: string | null) {
	const headers: Record<string, string> = {};
	if (orgId) {
		headers["x-organization-id"] = orgId;
	}
	return {
		withCredentials: true as const,
		headers,
	};
}

function ProjectService(apiServer: AxiosInstance) {
	const getProjects = async (
		orgId?: string | null
	): Promise<APIResponse<Record<string, unknown>[]>> => {
		let result = null;

		await apiServer.get(apiEndpoints.projects.list(), getHeaders(orgId)).then(
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
					data?.error || "Failed to fetch projects",
					status || 500,
					null,
					null
				);
			}
		);

		return result!;
	};

	const createProject = async (
		orgId: string | null | undefined,
		data: Record<string, unknown>
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(apiEndpoints.projects.create(), data, getHeaders(orgId))
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
						data?.error || "Failed to create project",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const getProject = async (
		orgId: string | null | undefined,
		id: string
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer.get(apiEndpoints.projects.get(id), getHeaders(orgId)).then(
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
					data?.error || "Failed to fetch project",
					status || 500,
					null,
					null
				);
			}
		);

		return result!;
	};

	const updateProject = async (
		orgId: string | null | undefined,
		id: string,
		data: Record<string, unknown>
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.patch(apiEndpoints.projects.update(id), data, getHeaders(orgId))
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
						data?.error || "Failed to update project",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const deleteProject = async (
		orgId: string | null | undefined,
		id: string
	): Promise<APIResponse<null>> => {
		let result = null;

		await apiServer
			.delete(apiEndpoints.projects.delete(id), getHeaders(orgId))
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
						data?.error || "Failed to delete project",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	return {
		getProjects,
		createProject,
		getProject,
		updateProject,
		deleteProject,
	};
}

export default ProjectService;
