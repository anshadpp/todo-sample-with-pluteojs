import {AxiosInstance} from "axios";

import NetworkUtil from "@/utils/NetworkUtil";
import {APIResponse} from "@/customTypes/NetworkTypes";

import {apiEndpoints} from "./axiosConfig/AxiosServiceConstants";

// Better-auth endpoints return data directly (no envelope wrapper)

function OrganizationService(apiServer: AxiosInstance) {
	const createOrganization = async (
		data: Record<string, unknown>
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(apiEndpoints.organizations.create(), data, {
				withCredentials: true,
			})
			.then(
				(value) => {
					result = NetworkUtil.buildResult<Record<string, unknown>>(
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
						data?.code || data?.error || "Failed to create organization",
						status || 500,
						data?.message || null,
						null
					);
				}
			);

		return result!;
	};

	const listOrganizations = async (): Promise<
		APIResponse<Record<string, unknown>[]>
	> => {
		let result = null;

		await apiServer
			.get(apiEndpoints.organizations.list(), {withCredentials: true})
			.then(
				(value) => {
					result = NetworkUtil.buildResult<Record<string, unknown>[]>(
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
						data?.code || data?.error || "Failed to list organizations",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const updateOrganization = async (data: {
		organizationId: string;
		name?: string;
		slug?: string;
		logo?: string;
	}): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(
				apiEndpoints.organizations.update(),
				{data},
				{
					withCredentials: true,
				}
			)
			.then(
				(value) => {
					result = NetworkUtil.buildResult<Record<string, unknown>>(
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
						data?.code || data?.error || "Failed to update organization",
						status || 500,
						data?.message || null,
						null
					);
				}
			);

		return result!;
	};

	const deleteOrganization = async (
		organizationId: string
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(
				apiEndpoints.organizations.delete(),
				{organizationId},
				{
					withCredentials: true,
				}
			)
			.then(
				(value) => {
					result = NetworkUtil.buildResult<Record<string, unknown>>(
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
						data?.code || data?.error || "Failed to delete organization",
						status || 500,
						data?.message || null,
						null
					);
				}
			);

		return result!;
	};

	const setActiveOrganization = async (
		orgId: string
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(
				apiEndpoints.organizations.setActive(),
				{organizationId: orgId},
				{withCredentials: true}
			)
			.then(
				(value) => {
					result = NetworkUtil.buildResult<Record<string, unknown>>(
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
						data?.code || data?.error || "Failed to set active organization",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const getFullOrganization = async (
		orgId: string
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.get(apiEndpoints.organizations.getFullOrg(orgId), {
				withCredentials: true,
			})
			.then(
				(value) => {
					result = NetworkUtil.buildResult<Record<string, unknown>>(
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
						data?.code || data?.error || "Failed to get organization",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const inviteMember = async (data: {
		organizationId: string;
		email: string;
		role: string;
	}): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(apiEndpoints.organizations.inviteMember(), data, {
				withCredentials: true,
			})
			.then(
				(value) => {
					result = NetworkUtil.buildResult<Record<string, unknown>>(
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
						data?.code || data?.error || "Failed to invite member",
						status || 500,
						data?.message || null,
						null
					);
				}
			);

		return result!;
	};

	const acceptInvitation = async (
		invitationId: string
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(
				apiEndpoints.organizations.acceptInvitation(),
				{invitationId},
				{withCredentials: true}
			)
			.then(
				(value) => {
					result = NetworkUtil.buildResult<Record<string, unknown>>(
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
						data?.code || data?.error || "Failed to accept invitation",
						status || 500,
						data?.message || null,
						null
					);
				}
			);

		return result!;
	};

	const rejectInvitation = async (
		invitationId: string
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(
				apiEndpoints.organizations.rejectInvitation(),
				{invitationId},
				{withCredentials: true}
			)
			.then(
				(value) => {
					result = NetworkUtil.buildResult<Record<string, unknown>>(
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
						data?.code || data?.error || "Failed to reject invitation",
						status || 500,
						data?.message || null,
						null
					);
				}
			);

		return result!;
	};

	const cancelInvitation = async (
		invitationId: string
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(
				apiEndpoints.organizations.cancelInvitation(),
				{invitationId},
				{withCredentials: true}
			)
			.then(
				(value) => {
					result = NetworkUtil.buildResult<Record<string, unknown>>(
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
						data?.code || data?.error || "Failed to cancel invitation",
						status || 500,
						data?.message || null,
						null
					);
				}
			);

		return result!;
	};

	const getInvitation = async (
		invitationId: string
	): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.get(apiEndpoints.organizations.getInvitation(invitationId), {
				withCredentials: true,
			})
			.then(
				(value) => {
					result = NetworkUtil.buildResult<Record<string, unknown>>(
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
						data?.code || data?.error || "Failed to get invitation",
						status || 500,
						data?.message || null,
						null
					);
				}
			);

		return result!;
	};

	const removeMember = async (data: {
		organizationId: string;
		memberIdOrEmail: string;
	}): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(apiEndpoints.organizations.removeMember(), data, {
				withCredentials: true,
			})
			.then(
				(value) => {
					result = NetworkUtil.buildResult<Record<string, unknown>>(
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
						data?.code || data?.error || "Failed to remove member",
						status || 500,
						data?.message || null,
						null
					);
				}
			);

		return result!;
	};

	const updateMemberRole = async (data: {
		organizationId: string;
		memberId: string;
		role: string;
	}): Promise<APIResponse<Record<string, unknown>>> => {
		let result = null;

		await apiServer
			.post(apiEndpoints.organizations.updateMemberRole(), data, {
				withCredentials: true,
			})
			.then(
				(value) => {
					result = NetworkUtil.buildResult<Record<string, unknown>>(
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
						data?.code || data?.error || "Failed to update member role",
						status || 500,
						data?.message || null,
						null
					);
				}
			);

		return result!;
	};

	return {
		createOrganization,
		updateOrganization,
		deleteOrganization,
		listOrganizations,
		setActiveOrganization,
		getFullOrganization,
		inviteMember,
		acceptInvitation,
		rejectInvitation,
		cancelInvitation,
		getInvitation,
		removeMember,
		updateMemberRole,
	};
}

export default OrganizationService;
