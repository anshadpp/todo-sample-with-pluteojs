import {create} from "zustand";
import {devtools} from "zustand/middleware";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {authService} from "@/services/api/PluteoJS";
import type {AuthUser} from "@/services/api/PluteoJS/AuthService";

import {
	initialRequestStatus,
	setPendingImm,
	setFulfilledImm,
	setRejectedImm,
} from "../common/RequestStatusHelpers";
import type {iAuthState} from "./Types";

interface AuthStore extends iAuthState {
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (name: string, email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
	getSession: () => Promise<void>;
	resetAuthState: () => void;
	clearSignInStatus: () => void;
	clearSignUpStatus: () => void;
}

const initialState: iAuthState = {
	user: null,
	isAuthenticated: false,
	sessionStatus: {...initialRequestStatus},
	signInStatus: {...initialRequestStatus},
	signUpStatus: {...initialRequestStatus},
	signOutStatus: {...initialRequestStatus},
};

export const useAuthStore = create<AuthStore>()(
	devtools(
		(set) => ({
			...initialState,

			signIn: async (email: string, password: string) => {
				set({signInStatus: setPendingImm()});
				const result = await authService.signIn(email, password);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						signInStatus: setFulfilledImm(),
						user: (result.data?.data as {user: AuthUser})?.user ?? null,
						isAuthenticated: true,
					});
				} else {
					set({
						signInStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			signUp: async (name: string, email: string, password: string) => {
				set({signUpStatus: setPendingImm()});
				const result = await authService.signUp(name, email, password);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_CREATED
				) {
					set({
						signUpStatus: setFulfilledImm(httpStatusCodes.SUCCESS_CREATED),
						user: (result.data?.data as {user: AuthUser})?.user ?? null,
						isAuthenticated: true,
					});
				} else {
					set({
						signUpStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			signOut: async () => {
				set({signOutStatus: setPendingImm()});
				await authService.signOut();
				set({...initialState});
			},

			getSession: async () => {
				set({sessionStatus: setPendingImm()});
				const result = await authService.getSession();
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						sessionStatus: setFulfilledImm(),
						user: (result.data?.data as {user: AuthUser})?.user ?? null,
						isAuthenticated: true,
					});
				} else {
					set({
						sessionStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
						user: null,
						isAuthenticated: false,
					});
				}
			},

			resetAuthState: () => set({...initialState}),
			clearSignInStatus: () => set({signInStatus: {...initialRequestStatus}}),
			clearSignUpStatus: () => set({signUpStatus: {...initialRequestStatus}}),
		}),
		{name: "authStore"}
	)
);
