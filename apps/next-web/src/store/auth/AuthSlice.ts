import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {authService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPending,
	setFulfilled,
	setRejected,
} from "../common/RequestStatusHelpers";
import {iAuthState, REDUCER_NAME} from "./Types";

// Thunks

export const signIn = createAsyncThunk(
	"auth/signIn",
	async (
		{email, password}: {email: string; password: string},
		{rejectWithValue}
	) => {
		const result = await authService.signIn(email, password);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const signUp = createAsyncThunk(
	"auth/signUp",
	async (
		{name, email, password}: {name: string; email: string; password: string},
		{rejectWithValue}
	) => {
		const result = await authService.signUp(name, email, password);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_CREATED
		) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const signOut = createAsyncThunk("auth/signOut", async () => {
	await authService.signOut();
});

export const getSession = createAsyncThunk(
	"auth/getSession",
	async (_, {rejectWithValue}) => {
		const result = await authService.getSession();
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

// Slice

const initialState: iAuthState = {
	user: null,
	isAuthenticated: false,
	sessionStatus: {...initialRequestStatus},
	signInStatus: {...initialRequestStatus},
	signUpStatus: {...initialRequestStatus},
	signOutStatus: {...initialRequestStatus},
};

export const authSlice = createSlice({
	name: REDUCER_NAME,
	initialState,
	reducers: {
		resetAuthState: () => initialState,
		clearSignInStatus: (state) => {
			state.signInStatus = {...initialRequestStatus};
		},
		clearSignUpStatus: (state) => {
			state.signUpStatus = {...initialRequestStatus};
		},
	},
	extraReducers: (builder) => {
		// signIn
		builder.addCase(signIn.pending, (state) => {
			setPending(state, "signInStatus");
		});
		builder.addCase(signIn.fulfilled, (state, action) => {
			setFulfilled(state, "signInStatus");
			state.user = action.payload.data?.data?.user ?? null;
			state.isAuthenticated = true;
		});
		builder.addCase(signIn.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"signInStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// signUp
		builder.addCase(signUp.pending, (state) => {
			setPending(state, "signUpStatus");
		});
		builder.addCase(signUp.fulfilled, (state, action) => {
			setFulfilled(state, "signUpStatus", httpStatusCodes.SUCCESS_CREATED);
			state.user = action.payload.data?.data?.user ?? null;
			state.isAuthenticated = true;
		});
		builder.addCase(signUp.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"signUpStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// signOut
		builder.addCase(signOut.pending, (state) => {
			setPending(state, "signOutStatus");
		});
		builder.addCase(signOut.fulfilled, () => initialState);
		builder.addCase(signOut.rejected, (state, action) => {
			setRejected(state, "signOutStatus", action.error.message);
		});

		// getSession
		builder.addCase(getSession.pending, (state) => {
			setPending(state, "sessionStatus");
		});
		builder.addCase(getSession.fulfilled, (state, action) => {
			setFulfilled(state, "sessionStatus");
			state.user = action.payload.data?.data?.user ?? null;
			state.isAuthenticated = true;
		});
		builder.addCase(getSession.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"sessionStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
			state.user = null;
			state.isAuthenticated = false;
		});
	},
});

export const {resetAuthState, clearSignInStatus, clearSignUpStatus} =
	authSlice.actions;

export default authSlice.reducer;
