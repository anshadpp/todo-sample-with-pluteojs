import {create} from "zustand";
import {devtools} from "zustand/middleware";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {memberService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPendingImm,
	setFulfilledImm,
	setRejectedImm,
} from "../common/RequestStatusHelpers";
import type {iMembersState} from "./Types";

interface MembersStore extends iMembersState {
	listMembers: () => Promise<void>;
	updateMemberTitle: (memberId: string, title: string) => Promise<void>;
	resetMembersState: () => void;
}

const initialState: iMembersState = {
	items: [],
	fetchStatus: {...initialRequestStatus},
	updateTitleStatus: {...initialRequestStatus},
};

export const useMembersStore = create<MembersStore>()(
	devtools(
		(set) => ({
			...initialState,

			listMembers: async () => {
				set({fetchStatus: setPendingImm()});
				const result = await memberService.getMembers();
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						items: (result.data as unknown as Record<string, unknown>[]) ?? [],
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

			updateMemberTitle: async (memberId, title) => {
				set({updateTitleStatus: setPendingImm()});
				const result = await memberService.updateMemberTitle(memberId, title);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({updateTitleStatus: setFulfilledImm()});
				} else {
					set({
						updateTitleStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			resetMembersState: () => set({...initialState}),
		}),
		{name: "membersStore"}
	)
);
