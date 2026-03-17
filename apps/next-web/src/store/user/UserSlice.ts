import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {userService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPending,
	setFulfilled,
	setRejected,
} from "../common/RequestStatusHelpers";
import {iUserState, REDUCER_NAME} from "./Types";

// Thunks

export const fetchProfile = createAsyncThunk(
	"user/fetchProfile",
	async (_, {rejectWithValue}) => {
		const result = await userService.getProfile();
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const updateProfile = createAsyncThunk(
	"user/updateProfile",
	async (data: {name?: string; image?: string | null}, {rejectWithValue}) => {
		const result = await userService.updateProfile(data);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

// Slice

const initialState: iUserState = {
	profile: null,
	fetchProfileStatus: {...initialRequestStatus},
	updateProfileStatus: {...initialRequestStatus},
};

export const userSlice = createSlice({
	name: REDUCER_NAME,
	initialState,
	reducers: {
		resetUserState: () => initialState,
	},
	extraReducers: (builder) => {
		// fetchProfile
		builder.addCase(fetchProfile.pending, (state) => {
			setPending(state, "fetchProfileStatus");
		});
		builder.addCase(fetchProfile.fulfilled, (state, action) => {
			setFulfilled(state, "fetchProfileStatus");
			state.profile =
				(action.payload.data?.data as Record<string, unknown>) ?? null;
		});
		builder.addCase(fetchProfile.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"fetchProfileStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// updateProfile
		builder.addCase(updateProfile.pending, (state) => {
			setPending(state, "updateProfileStatus");
		});
		builder.addCase(updateProfile.fulfilled, (state, action) => {
			setFulfilled(state, "updateProfileStatus");
			const updated = action.payload.data?.data as Record<string, unknown>;
			if (updated) {
				state.profile = updated;
			}
		});
		builder.addCase(updateProfile.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"updateProfileStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});
	},
});

export const {resetUserState} = userSlice.actions;

export default userSlice.reducer;
