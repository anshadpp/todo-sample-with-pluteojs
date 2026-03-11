import {AxiosInstance} from "axios";

import NetworkUtil from "@/utils/NetworkUtil";
import {APIResponse} from "@/customTypes/NetworkTypes";

import {apiEndpoints} from "./axiosConfig/AxiosServiceConstants";

interface EnvelopeResponse<T> {
	isSuccess: boolean;
	data: T;
	error: unknown;
}

function MemberService(apiServer: AxiosInstance) {
	const getMembers = async (): Promise<
		APIResponse<Record<string, unknown>[]>
	> => {
		let result = null;

		const activeOrgId = localStorage.getItem("activeOrgId") || "";

		await apiServer
			.get(apiEndpoints.members.list(), {
				withCredentials: true,
				headers: {
					"x-organization-id": activeOrgId,
				},
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
						data?.error || "Failed to fetch members",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const updateMemberTitle = async (
		memberId: string,
		title: string | null
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;
		const activeOrgId = localStorage.getItem("activeOrgId") || "";

		await apiServer
			.patch(
				apiEndpoints.members.updateTitle(memberId),
				{title},
				{
					withCredentials: true,
					headers: {"x-organization-id": activeOrgId},
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
						data?.error || "Failed to update member title",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	return {
		getMembers,
		updateMemberTitle,
	};
}

export default MemberService;
