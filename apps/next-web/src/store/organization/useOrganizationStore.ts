import {create} from "zustand";
import {devtools} from "zustand/middleware";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {organizationService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPendingImm,
	setFulfilledImm,
	setRejectedImm,
} from "../common/RequestStatusHelpers";
import type {iOrganizationState} from "./Types";

interface OrganizationStore extends iOrganizationState {
	listOrganizations: () => Promise<void>;
	createOrganization: (data: Record<string, unknown>) => Promise<void>;
	updateOrganization: (data: {
		organizationId: string;
		name?: string;
		slug?: string;
		logo?: string;
	}) => Promise<void>;
	deleteOrganization: (organizationId: string) => Promise<void>;
	setActiveOrganization: (orgId: string) => Promise<void>;
	getFullOrganization: (orgId: string) => Promise<void>;
	inviteMember: (data: {
		organizationId: string;
		email: string;
		role: string;
	}) => Promise<void>;
	acceptInvitation: (invitationId: string) => Promise<void>;
	rejectInvitation: (invitationId: string) => Promise<void>;
	resetOrganizationState: () => void;
	setActiveOrgId: (orgId: string | null) => void;
	clearCreateStatus: () => void;
	clearInviteStatus: () => void;
}

const initialState: iOrganizationState = {
	organizations: [],
	activeOrganizationId: null,
	activeOrganization: null,
	fetchStatus: {...initialRequestStatus},
	createStatus: {...initialRequestStatus},
	updateStatus: {...initialRequestStatus},
	deleteStatus: {...initialRequestStatus},
	setActiveStatus: {...initialRequestStatus},
	inviteStatus: {...initialRequestStatus},
	acceptInvitationStatus: {...initialRequestStatus},
	rejectInvitationStatus: {...initialRequestStatus},
};

export const useOrganizationStore = create<OrganizationStore>()(
	devtools(
		(set, get) => ({
			...initialState,

			listOrganizations: async () => {
				set({fetchStatus: setPendingImm()});
				const result = await organizationService.listOrganizations();
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						organizations:
							(result.data as unknown as Record<string, unknown>[]) ?? [],
						fetchStatus: setFulfilledImm(),
					});
				} else {
					set({
						fetchStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			createOrganization: async (data: Record<string, unknown>) => {
				set({createStatus: setPendingImm()});
				const result = await organizationService.createOrganization(data);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					const newOrg = result.data as unknown as Record<string, unknown>;
					set({
						createStatus: setFulfilledImm(),
						organizations: newOrg
							? [...get().organizations, newOrg]
							: get().organizations,
					});
				} else {
					set({
						createStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			updateOrganization: async (data) => {
				set({updateStatus: setPendingImm()});
				const result = await organizationService.updateOrganization(data);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({updateStatus: setFulfilledImm()});
				} else {
					set({
						updateStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			deleteOrganization: async (organizationId: string) => {
				set({deleteStatus: setPendingImm()});
				const result =
					await organizationService.deleteOrganization(organizationId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({deleteStatus: setFulfilledImm()});
				} else {
					set({
						deleteStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			setActiveOrganization: async (orgId: string) => {
				set({setActiveStatus: setPendingImm()});
				const result = await organizationService.setActiveOrganization(orgId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						setActiveStatus: setFulfilledImm(),
						activeOrganizationId: orgId,
					});
				} else {
					set({
						setActiveStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			getFullOrganization: async (orgId: string) => {
				const result = await organizationService.getFullOrganization(orgId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						activeOrganization:
							(result.data as unknown as Record<string, unknown>) ?? null,
					});
				}
			},

			inviteMember: async (data) => {
				set({inviteStatus: setPendingImm()});
				const result = await organizationService.inviteMember(data);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({inviteStatus: setFulfilledImm()});
				} else {
					set({
						inviteStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			acceptInvitation: async (invitationId: string) => {
				set({acceptInvitationStatus: setPendingImm()});
				const result = await organizationService.acceptInvitation(invitationId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({acceptInvitationStatus: setFulfilledImm()});
				} else {
					set({
						acceptInvitationStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			rejectInvitation: async (invitationId: string) => {
				set({rejectInvitationStatus: setPendingImm()});
				const result = await organizationService.rejectInvitation(invitationId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({rejectInvitationStatus: setFulfilledImm()});
				} else {
					set({
						rejectInvitationStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			resetOrganizationState: () => set({...initialState}),
			setActiveOrgId: (orgId: string | null) =>
				set({activeOrganizationId: orgId}),
			clearCreateStatus: () => set({createStatus: {...initialRequestStatus}}),
			clearInviteStatus: () => set({inviteStatus: {...initialRequestStatus}}),
		}),
		{name: "organizationStore"}
	)
);
