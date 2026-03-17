import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {taskService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPending,
	setFulfilled,
	setRejected,
} from "../common/RequestStatusHelpers";
import {iTasksState, REDUCER_NAME} from "./Types";

// Thunks

export const fetchTasks = createAsyncThunk(
	"tasks/fetchTasks",
	async (projectId: string, {rejectWithValue}) => {
		const result = await taskService.getTasks(projectId);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const createTask = createAsyncThunk(
	"tasks/createTask",
	async (
		{projectId, data}: {projectId: string; data: Record<string, unknown>},
		{rejectWithValue}
	) => {
		const result = await taskService.createTask(projectId, data);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_CREATED
		) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const getTask = createAsyncThunk(
	"tasks/getTask",
	async (taskId: string, {rejectWithValue}) => {
		const result = await taskService.getTask(taskId);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const updateTask = createAsyncThunk(
	"tasks/updateTask",
	async (
		{taskId, data}: {taskId: string; data: Record<string, unknown>},
		{rejectWithValue}
	) => {
		const result = await taskService.updateTask(taskId, data);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const moveTask = createAsyncThunk(
	"tasks/moveTask",
	async (
		{taskId, data}: {taskId: string; data: Record<string, unknown>},
		{rejectWithValue}
	) => {
		const result = await taskService.moveTask(taskId, data);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const reorderTasks = createAsyncThunk(
	"tasks/reorderTasks",
	async (tasks: Record<string, unknown>[], {rejectWithValue}) => {
		const result = await taskService.reorderTasks(tasks);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const deleteTask = createAsyncThunk(
	"tasks/deleteTask",
	async (taskId: string, {rejectWithValue}) => {
		const result = await taskService.deleteTask(taskId);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_NO_CONTENT
		) {
			return rejectWithValue(result);
		}
		return {result, taskId};
	}
);

// Slice

const initialState: iTasksState = {
	items: [],
	selectedTask: null,
	fetchStatus: {...initialRequestStatus},
	createStatus: {...initialRequestStatus},
	updateStatus: {...initialRequestStatus},
	deleteStatus: {...initialRequestStatus},
	moveStatus: {...initialRequestStatus},
	reorderStatus: {...initialRequestStatus},
	getTaskStatus: {...initialRequestStatus},
};

export const tasksSlice = createSlice({
	name: REDUCER_NAME,
	initialState,
	reducers: {
		resetTasksState: () => initialState,
		clearSelectedTask: (state) => {
			state.selectedTask = null;
		},
		clearCreateStatus: (state) => {
			state.createStatus = {...initialRequestStatus};
		},
	},
	extraReducers: (builder) => {
		// fetchTasks
		builder.addCase(fetchTasks.pending, (state) => {
			setPending(state, "fetchStatus");
		});
		builder.addCase(fetchTasks.fulfilled, (state, action) => {
			setFulfilled(state, "fetchStatus");
			state.items =
				(action.payload.data?.data as Record<string, unknown>[]) ?? [];
		});
		builder.addCase(fetchTasks.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"fetchStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// createTask
		builder.addCase(createTask.pending, (state) => {
			setPending(state, "createStatus");
		});
		builder.addCase(createTask.fulfilled, (state, action) => {
			setFulfilled(state, "createStatus", httpStatusCodes.SUCCESS_CREATED);
			const newTask = action.payload.data?.data as Record<string, unknown>;
			if (newTask) {
				state.items.push(newTask);
			}
		});
		builder.addCase(createTask.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"createStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// getTask
		builder.addCase(getTask.pending, (state) => {
			setPending(state, "getTaskStatus");
		});
		builder.addCase(getTask.fulfilled, (state, action) => {
			setFulfilled(state, "getTaskStatus");
			state.selectedTask =
				(action.payload.data?.data as Record<string, unknown>) ?? null;
		});
		builder.addCase(getTask.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"getTaskStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// updateTask
		builder.addCase(updateTask.pending, (state) => {
			setPending(state, "updateStatus");
		});
		builder.addCase(updateTask.fulfilled, (state, action) => {
			setFulfilled(state, "updateStatus");
			const updated = action.payload.data?.data as Record<string, unknown>;
			if (updated) {
				const index = state.items.findIndex((item) => item.id === updated.id);
				if (index !== -1) {
					state.items[index] = updated;
				}
				if (state.selectedTask?.id === updated.id) {
					state.selectedTask = updated;
				}
			}
		});
		builder.addCase(updateTask.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"updateStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// moveTask
		builder.addCase(moveTask.pending, (state) => {
			setPending(state, "moveStatus");
		});
		builder.addCase(moveTask.fulfilled, (state) => {
			setFulfilled(state, "moveStatus");
		});
		builder.addCase(moveTask.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"moveStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// reorderTasks
		builder.addCase(reorderTasks.pending, (state) => {
			setPending(state, "reorderStatus");
		});
		builder.addCase(reorderTasks.fulfilled, (state) => {
			setFulfilled(state, "reorderStatus");
		});
		builder.addCase(reorderTasks.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"reorderStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// deleteTask
		builder.addCase(deleteTask.pending, (state) => {
			setPending(state, "deleteStatus");
		});
		builder.addCase(deleteTask.fulfilled, (state, action) => {
			setFulfilled(state, "deleteStatus", httpStatusCodes.SUCCESS_NO_CONTENT);
			state.items = state.items.filter(
				(item) => item.id !== action.payload.taskId
			);
			if (state.selectedTask?.id === action.payload.taskId) {
				state.selectedTask = null;
			}
		});
		builder.addCase(deleteTask.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"deleteStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});
	},
});

export const {resetTasksState, clearSelectedTask, clearCreateStatus} =
	tasksSlice.actions;

export default tasksSlice.reducer;
