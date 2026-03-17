import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {autoSortRuleService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPending,
	setFulfilled,
	setRejected,
} from "../common/RequestStatusHelpers";
import {iAutoSortRulesState, REDUCER_NAME} from "./Types";

// Thunks

export const fetchAutoSortRules = createAsyncThunk(
	"autoSortRules/fetchAutoSortRules",
	async (projectId: string, {rejectWithValue}) => {
		const result = await autoSortRuleService.getRules(projectId);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const createAutoSortRule = createAsyncThunk(
	"autoSortRules/createAutoSortRule",
	async (
		{
			projectId,
			ruleData,
		}: {projectId: string; ruleData: Record<string, unknown>},
		{rejectWithValue}
	) => {
		const result = await autoSortRuleService.createRule(projectId, ruleData);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_CREATED
		) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const updateAutoSortRule = createAsyncThunk(
	"autoSortRules/updateAutoSortRule",
	async (
		{ruleId, ruleData}: {ruleId: string; ruleData: Record<string, unknown>},
		{rejectWithValue}
	) => {
		const result = await autoSortRuleService.updateRule(ruleId, ruleData);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const deleteAutoSortRule = createAsyncThunk(
	"autoSortRules/deleteAutoSortRule",
	async (ruleId: string, {rejectWithValue}) => {
		const result = await autoSortRuleService.deleteRule(ruleId);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_NO_CONTENT
		) {
			return rejectWithValue(result);
		}
		return {result, ruleId};
	}
);

export const evaluateAutoSortRules = createAsyncThunk(
	"autoSortRules/evaluateAutoSortRules",
	async (projectId: string, {rejectWithValue}) => {
		const result = await autoSortRuleService.evaluateRules(projectId);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

// Slice

const initialState: iAutoSortRulesState = {
	items: [],
	fetchStatus: {...initialRequestStatus},
	createStatus: {...initialRequestStatus},
	updateStatus: {...initialRequestStatus},
	deleteStatus: {...initialRequestStatus},
	evaluateStatus: {...initialRequestStatus},
};

export const autoSortRulesSlice = createSlice({
	name: REDUCER_NAME,
	initialState,
	reducers: {
		resetAutoSortRulesState: () => initialState,
		clearCreateStatus: (state) => {
			state.createStatus = {...initialRequestStatus};
		},
	},
	extraReducers: (builder) => {
		// fetchAutoSortRules
		builder.addCase(fetchAutoSortRules.pending, (state) => {
			setPending(state, "fetchStatus");
		});
		builder.addCase(fetchAutoSortRules.fulfilled, (state, action) => {
			setFulfilled(state, "fetchStatus");
			state.items =
				(action.payload.data?.data as Record<string, unknown>[]) ?? [];
		});
		builder.addCase(fetchAutoSortRules.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"fetchStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// createAutoSortRule
		builder.addCase(createAutoSortRule.pending, (state) => {
			setPending(state, "createStatus");
		});
		builder.addCase(createAutoSortRule.fulfilled, (state, action) => {
			setFulfilled(state, "createStatus", httpStatusCodes.SUCCESS_CREATED);
			const newRule = action.payload.data?.data as Record<string, unknown>;
			if (newRule) {
				state.items.push(newRule);
			}
		});
		builder.addCase(createAutoSortRule.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"createStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// updateAutoSortRule
		builder.addCase(updateAutoSortRule.pending, (state) => {
			setPending(state, "updateStatus");
		});
		builder.addCase(updateAutoSortRule.fulfilled, (state, action) => {
			setFulfilled(state, "updateStatus");
			const updated = action.payload.data?.data as Record<string, unknown>;
			if (updated) {
				const index = state.items.findIndex((item) => item.id === updated.id);
				if (index !== -1) {
					state.items[index] = updated;
				}
			}
		});
		builder.addCase(updateAutoSortRule.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"updateStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// deleteAutoSortRule
		builder.addCase(deleteAutoSortRule.pending, (state) => {
			setPending(state, "deleteStatus");
		});
		builder.addCase(deleteAutoSortRule.fulfilled, (state, action) => {
			setFulfilled(state, "deleteStatus", httpStatusCodes.SUCCESS_NO_CONTENT);
			state.items = state.items.filter(
				(item) => item.id !== action.payload.ruleId
			);
		});
		builder.addCase(deleteAutoSortRule.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"deleteStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// evaluateAutoSortRules
		builder.addCase(evaluateAutoSortRules.pending, (state) => {
			setPending(state, "evaluateStatus");
		});
		builder.addCase(evaluateAutoSortRules.fulfilled, (state) => {
			setFulfilled(state, "evaluateStatus");
		});
		builder.addCase(evaluateAutoSortRules.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"evaluateStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});
	},
});

export const {resetAutoSortRulesState, clearCreateStatus} =
	autoSortRulesSlice.actions;

export default autoSortRulesSlice.reducer;
