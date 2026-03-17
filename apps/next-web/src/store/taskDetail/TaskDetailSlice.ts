import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {
	commentService,
	activityService,
	taskService,
} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPending,
	setFulfilled,
	setRejected,
} from "../common/RequestStatusHelpers";
import {iTaskDetailState, REDUCER_NAME} from "./Types";

// Thunks

export const fetchComments = createAsyncThunk(
	"taskDetail/fetchComments",
	async (taskId: string, {rejectWithValue}) => {
		const result = await commentService.getComments(taskId);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const createComment = createAsyncThunk(
	"taskDetail/createComment",
	async (
		{taskId, data}: {taskId: string; data: Record<string, unknown>},
		{rejectWithValue}
	) => {
		const result = await commentService.createComment(taskId, data);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_CREATED
		) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const updateComment = createAsyncThunk(
	"taskDetail/updateComment",
	async (
		{
			taskId,
			commentId,
			data,
		}: {taskId: string; commentId: string; data: Record<string, unknown>},
		{rejectWithValue}
	) => {
		const result = await commentService.updateComment(taskId, commentId, data);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const deleteComment = createAsyncThunk(
	"taskDetail/deleteComment",
	async (
		{taskId, commentId}: {taskId: string; commentId: string},
		{rejectWithValue}
	) => {
		const result = await commentService.deleteComment(taskId, commentId);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_NO_CONTENT
		) {
			return rejectWithValue(result);
		}
		return {result, commentId};
	}
);

export const fetchActivities = createAsyncThunk(
	"taskDetail/fetchActivities",
	async (taskId: string, {rejectWithValue}) => {
		const result = await activityService.getActivities(taskId);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const getDependencies = createAsyncThunk(
	"taskDetail/getDependencies",
	async (taskId: string, {rejectWithValue}) => {
		const result = await taskService.getDependencies(taskId);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const addDependency = createAsyncThunk(
	"taskDetail/addDependency",
	async (
		{
			taskId,
			dependsOnTaskId,
			dependencyType,
		}: {taskId: string; dependsOnTaskId: string; dependencyType?: string},
		{rejectWithValue}
	) => {
		const result = await taskService.addDependency(
			taskId,
			dependsOnTaskId,
			dependencyType
		);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_CREATED
		) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const removeDependency = createAsyncThunk(
	"taskDetail/removeDependency",
	async (
		{taskId, dependencyId}: {taskId: string; dependencyId: string},
		{rejectWithValue}
	) => {
		const result = await taskService.removeDependency(taskId, dependencyId);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_NO_CONTENT
		) {
			return rejectWithValue(result);
		}
		return {result, dependencyId};
	}
);

// Slice

const initialState: iTaskDetailState = {
	comments: [],
	activities: [],
	dependencies: null,
	fetchCommentsStatus: {...initialRequestStatus},
	createCommentStatus: {...initialRequestStatus},
	updateCommentStatus: {...initialRequestStatus},
	deleteCommentStatus: {...initialRequestStatus},
	fetchActivitiesStatus: {...initialRequestStatus},
	fetchDependenciesStatus: {...initialRequestStatus},
	addDependencyStatus: {...initialRequestStatus},
	removeDependencyStatus: {...initialRequestStatus},
};

export const taskDetailSlice = createSlice({
	name: REDUCER_NAME,
	initialState,
	reducers: {
		resetTaskDetailState: () => initialState,
		clearComments: (state) => {
			state.comments = [];
		},
		clearActivities: (state) => {
			state.activities = [];
		},
	},
	extraReducers: (builder) => {
		// fetchComments
		builder.addCase(fetchComments.pending, (state) => {
			setPending(state, "fetchCommentsStatus");
		});
		builder.addCase(fetchComments.fulfilled, (state, action) => {
			setFulfilled(state, "fetchCommentsStatus");
			state.comments =
				(action.payload.data?.data as Record<string, unknown>[]) ?? [];
		});
		builder.addCase(fetchComments.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"fetchCommentsStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// createComment
		builder.addCase(createComment.pending, (state) => {
			setPending(state, "createCommentStatus");
		});
		builder.addCase(createComment.fulfilled, (state, action) => {
			setFulfilled(
				state,
				"createCommentStatus",
				httpStatusCodes.SUCCESS_CREATED
			);
			const newComment = action.payload.data?.data as Record<string, unknown>;
			if (newComment) {
				state.comments.push(newComment);
			}
		});
		builder.addCase(createComment.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"createCommentStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// updateComment
		builder.addCase(updateComment.pending, (state) => {
			setPending(state, "updateCommentStatus");
		});
		builder.addCase(updateComment.fulfilled, (state, action) => {
			setFulfilled(state, "updateCommentStatus");
			const updated = action.payload.data?.data as Record<string, unknown>;
			if (updated) {
				const index = state.comments.findIndex((c) => c.id === updated.id);
				if (index !== -1) {
					state.comments[index] = updated;
				}
			}
		});
		builder.addCase(updateComment.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"updateCommentStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// deleteComment
		builder.addCase(deleteComment.pending, (state) => {
			setPending(state, "deleteCommentStatus");
		});
		builder.addCase(deleteComment.fulfilled, (state, action) => {
			setFulfilled(
				state,
				"deleteCommentStatus",
				httpStatusCodes.SUCCESS_NO_CONTENT
			);
			state.comments = state.comments.filter(
				(c) => c.id !== action.payload.commentId
			);
		});
		builder.addCase(deleteComment.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"deleteCommentStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// fetchActivities
		builder.addCase(fetchActivities.pending, (state) => {
			setPending(state, "fetchActivitiesStatus");
		});
		builder.addCase(fetchActivities.fulfilled, (state, action) => {
			setFulfilled(state, "fetchActivitiesStatus");
			state.activities =
				(action.payload.data?.data as Record<string, unknown>[]) ?? [];
		});
		builder.addCase(fetchActivities.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"fetchActivitiesStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// getDependencies
		builder.addCase(getDependencies.pending, (state) => {
			setPending(state, "fetchDependenciesStatus");
		});
		builder.addCase(getDependencies.fulfilled, (state, action) => {
			setFulfilled(state, "fetchDependenciesStatus");
			state.dependencies =
				(action.payload.data?.data as Record<string, unknown>) ?? null;
		});
		builder.addCase(getDependencies.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"fetchDependenciesStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// addDependency
		builder.addCase(addDependency.pending, (state) => {
			setPending(state, "addDependencyStatus");
		});
		builder.addCase(addDependency.fulfilled, (state) => {
			setFulfilled(
				state,
				"addDependencyStatus",
				httpStatusCodes.SUCCESS_CREATED
			);
		});
		builder.addCase(addDependency.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"addDependencyStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// removeDependency
		builder.addCase(removeDependency.pending, (state) => {
			setPending(state, "removeDependencyStatus");
		});
		builder.addCase(removeDependency.fulfilled, (state) => {
			setFulfilled(
				state,
				"removeDependencyStatus",
				httpStatusCodes.SUCCESS_NO_CONTENT
			);
		});
		builder.addCase(removeDependency.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"removeDependencyStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});
	},
});

export const {resetTaskDetailState, clearComments, clearActivities} =
	taskDetailSlice.actions;

export default taskDetailSlice.reducer;
