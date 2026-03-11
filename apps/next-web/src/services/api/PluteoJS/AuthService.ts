import {AxiosInstance} from "axios";

import NetworkUtil from "@/utils/NetworkUtil";
import {APIResponse} from "@/customTypes/NetworkTypes";

import {apiEndpoints} from "./axiosConfig/AxiosServiceConstants";

export interface AuthUser {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface SignInResponse {
	token: string;
	user: AuthUser;
}

export interface SignUpResponse {
	token: string;
	user: AuthUser;
}

function AuthService(apiServer: AxiosInstance) {
	const signIn = async (
		email: string,
		password: string
	): Promise<APIResponse<SignInResponse>> => {
		let result = null;

		await apiServer
			.post(
				apiEndpoints.auth.signIn(),
				{email, password},
				{withCredentials: true}
			)
			.then(
				(value) => {
					result = NetworkUtil.buildResult<SignInResponse>(
						null,
						value.status,
						null,
						value.data
					);
				},
				(reason) => {
					const {response} = reason;
					const {status, data} = response || {};
					result = NetworkUtil.buildResult<null>(
						data?.error || "Sign in failed",
						status || 500,
						data?.message || "Invalid credentials",
						null
					);
				}
			);

		return result!;
	};

	const signUp = async (
		name: string,
		email: string,
		password: string
	): Promise<APIResponse<SignUpResponse>> => {
		let result = null;

		await apiServer
			.post(
				apiEndpoints.auth.signUp(),
				{name, email, password},
				{withCredentials: true}
			)
			.then(
				(value) => {
					result = NetworkUtil.buildResult<SignUpResponse>(
						null,
						value.status,
						null,
						value.data
					);
				},
				(reason) => {
					const {response} = reason;
					const {status, data} = response || {};
					result = NetworkUtil.buildResult<null>(
						data?.error || "Sign up failed",
						status || 500,
						data?.message || "Registration failed",
						null
					);
				}
			);

		return result!;
	};

	const signOut = async (): Promise<void> => {
		await apiServer
			.post(apiEndpoints.auth.signOut(), {}, {withCredentials: true})
			.catch(() => {});
	};

	const getSession = async (): Promise<APIResponse<{user: AuthUser}>> => {
		let result = null;

		await apiServer
			.get(apiEndpoints.auth.getSession(), {withCredentials: true})
			.then(
				(value) => {
					result = NetworkUtil.buildResult<{user: AuthUser}>(
						null,
						value.status,
						null,
						value.data
					);
				},
				(reason) => {
					const {response} = reason;
					const {status, data} = response || {};
					result = NetworkUtil.buildResult<null>(
						data?.error || "Not authenticated",
						status || 401,
						null,
						null
					);
				}
			);

		return result!;
	};

	return {
		signIn,
		signUp,
		signOut,
		getSession,
	};
}

export default AuthService;
