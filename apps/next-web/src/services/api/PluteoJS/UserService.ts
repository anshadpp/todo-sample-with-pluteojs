import {AxiosInstance} from "axios";

import NetworkUtil from "@/utils/NetworkUtil";
import {APIResponse} from "@/customTypes/NetworkTypes";

import {apiEndpoints} from "./axiosConfig/AxiosServiceConstants";

interface EnvelopeResponse<T> {
	isSuccess: boolean;
	data: T;
	error: unknown;
}

function UserService(apiServer: AxiosInstance) {
	const getProfile = async (): Promise<
		APIResponse<Record<string, unknown>>
	> => {
		let result = null;

		await apiServer.get(apiEndpoints.users.get(), {withCredentials: true}).then(
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
					data?.error || "Failed to fetch profile",
					status || 500,
					null,
					null
				);
			}
		);

		return result!;
	};

	const updateProfile = async (data: {
		name?: string;
		image?: string | null;
	}): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.patch(apiEndpoints.users.update(), data, {withCredentials: true})
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
						data?.error || "Failed to update profile",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	return {
		getProfile,
		updateProfile,
	};
}

export default UserService;
