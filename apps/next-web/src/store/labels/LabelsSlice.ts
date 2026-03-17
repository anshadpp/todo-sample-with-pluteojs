import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {labelService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPending,
	setFulfilled,
	setRejected,
} from "../common/RequestStatusHelpers";
import {iLabelsState, REDUCER_NAME} from "./Types";

// Thunks

export const fetchLabels = createAsyncThunk(
	"labels/fetchLabels",
	async (projectId: string, {rejectWithValue}) => {
		const result = await labelService.getLabels(projectId);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const createLabel = createAsyncThunk(
	"labels/createLabel",
	async (
		{projectId, data}: {projectId: string; data: Record<string, unknown>},
		{rejectWithValue}
	) => {
		const result = await labelService.createLabel(projectId, data);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_CREATED
		) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const addLabelToTask = createAsyncThunk(
	"labels/addLabelToTask",
	async (
		{taskId, labelId}: {taskId: string; labelId: string},
		{rejectWithValue}
	) => {
		const result = await labelService.addLabelToTask(taskId, labelId);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const removeLabelFromTask = createAsyncThunk(
	"labels/removeLabelFromTask",
	async (
		{taskId, labelId}: {taskId: string; labelId: string},
		{rejectWithValue}
	) => {
		const result = await labelService.removeLabelFromTask(taskId, labelId);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_NO_CONTENT
		) {
			return rejectWithValue(result);
		}
		return result;
	}
);

// Slice

const initialState: iLabelsState = {
	items: [],
	fetchStatus: {...initialRequestStatus},
	createStatus: {...initialRequestStatus},
	addToTaskStatus: {...initialRequestStatus},
	removeFromTaskStatus: {...initialRequestStatus},
};

export const labelsSlice = createSlice({
	name: REDUCER_NAME,
	initialState,
	reducers: {
		resetLabelsState: () => initialState,
		clearCreateStatus: (state) => {
			state.createStatus = {...initialRequestStatus};
		},
	},
	extraReducers: (builder) => {
		// fetchLabels
		builder.addCase(fetchLabels.pending, (state) => {
			setPending(state, "fetchStatus");
		});
		builder.addCase(fetchLabels.fulfilled, (state, action) => {
			setFulfilled(state, "fetchStatus");
			state.items =
				(action.payload.data?.data as Record<string, unknown>[]) ?? [];
		});
		builder.addCase(fetchLabels.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"fetchStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// createLabel
		builder.addCase(createLabel.pending, (state) => {
			setPending(state, "createStatus");
		});
		builder.addCase(createLabel.fulfilled, (state, action) => {
			setFulfilled(state, "createStatus", httpStatusCodes.SUCCESS_CREATED);
			const newLabel = action.payload.data?.data as Record<string, unknown>;
			if (newLabel) {
				state.items.push(newLabel);
			}
		});
		builder.addCase(createLabel.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"createStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// addLabelToTask
		builder.addCase(addLabelToTask.pending, (state) => {
			setPending(state, "addToTaskStatus");
		});
		builder.addCase(addLabelToTask.fulfilled, (state) => {
			setFulfilled(state, "addToTaskStatus");
		});
		builder.addCase(addLabelToTask.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"addToTaskStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// removeLabelFromTask
		builder.addCase(removeLabelFromTask.pending, (state) => {
			setPending(state, "removeFromTaskStatus");
		});
		builder.addCase(removeLabelFromTask.fulfilled, (state) => {
			setFulfilled(
				state,
				"removeFromTaskStatus",
				httpStatusCodes.SUCCESS_NO_CONTENT
			);
		});
		builder.addCase(removeLabelFromTask.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"removeFromTaskStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});
	},
});

export const {resetLabelsState, clearCreateStatus} = labelsSlice.actions;

export default labelsSlice.reducer;
