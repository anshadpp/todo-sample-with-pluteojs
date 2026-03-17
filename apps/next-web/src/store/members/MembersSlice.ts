import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {memberService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPending,
	setFulfilled,
	setRejected,
} from "../common/RequestStatusHelpers";
import {iMembersState, REDUCER_NAME} from "./Types";

// Thunks

export const fetchMembers = createAsyncThunk(
	"members/fetchMembers",
	async (_, {rejectWithValue}) => {
		const result = await memberService.getMembers();
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const updateMemberTitle = createAsyncThunk(
	"members/updateMemberTitle",
	async (
		{memberId, title}: {memberId: string; title: string | null},
		{rejectWithValue}
	) => {
		const result = await memberService.updateMemberTitle(memberId, title);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return {result, memberId};
	}
);

// Slice

const initialState: iMembersState = {
	items: [],
	fetchStatus: {...initialRequestStatus},
	updateTitleStatus: {...initialRequestStatus},
};

export const membersSlice = createSlice({
	name: REDUCER_NAME,
	initialState,
	reducers: {
		resetMembersState: () => initialState,
	},
	extraReducers: (builder) => {
		// fetchMembers
		builder.addCase(fetchMembers.pending, (state) => {
			setPending(state, "fetchStatus");
		});
		builder.addCase(fetchMembers.fulfilled, (state, action) => {
			setFulfilled(state, "fetchStatus");
			state.items =
				(action.payload.data?.data as Record<string, unknown>[]) ?? [];
		});
		builder.addCase(fetchMembers.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"fetchStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// updateMemberTitle
		builder.addCase(updateMemberTitle.pending, (state) => {
			setPending(state, "updateTitleStatus");
		});
		builder.addCase(updateMemberTitle.fulfilled, (state) => {
			setFulfilled(state, "updateTitleStatus");
		});
		builder.addCase(updateMemberTitle.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"updateTitleStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});
	},
});

export const {resetMembersState} = membersSlice.actions;

export default membersSlice.reducer;
