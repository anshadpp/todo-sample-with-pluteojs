import {create} from "zustand";
import {devtools} from "zustand/middleware";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {userService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPendingImm,
	setFulfilledImm,
	setRejectedImm,
} from "../common/RequestStatusHelpers";
import type {iUserState} from "./Types";

interface UserStore extends iUserState {
	fetchUserProfile: () => Promise<void>;
	updateUserProfile: (data: Record<string, unknown>) => Promise<void>;
	resetUserState: () => void;
}

const initialState: iUserState = {
	profile: null,
	fetchStatus: {...initialRequestStatus},
	updateStatus: {...initialRequestStatus},
};

export const useUserStore = create<UserStore>()(
	devtools(
		(set) => ({
			...initialState,

			fetchUserProfile: async () => {
				set({fetchStatus: setPendingImm()});
				const result = await userService.getProfile();
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						profile: (result.data?.data as Record<string, unknown>) ?? null,
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

			updateUserProfile: async (data) => {
				set({updateStatus: setPendingImm()});
				const result = await userService.updateProfile(data);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					const updated = result.data?.data as Record<string, unknown>;
					set({
						updateStatus: setFulfilledImm(),
						profile: updated ?? null,
					});
				} else {
					set({
						updateStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			resetUserState: () => set({...initialState}),
		}),
		{name: "userStore"}
	)
);
