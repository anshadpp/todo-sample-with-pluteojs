import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {projectService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPending,
	setFulfilled,
	setRejected,
} from "../common/RequestStatusHelpers";
import {iProjectsState, REDUCER_NAME} from "./Types";

// Thunks

export const fetchProjects = createAsyncThunk(
	"projects/fetchProjects",
	async (orgId: string | null | undefined, {rejectWithValue}) => {
		const result = await projectService.getProjects(orgId);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const createProject = createAsyncThunk(
	"projects/createProject",
	async (
		{
			orgId,
			data,
		}: {orgId: string | null | undefined; data: Record<string, unknown>},
		{rejectWithValue}
	) => {
		const result = await projectService.createProject(orgId, data);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_CREATED
		) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const getProject = createAsyncThunk(
	"projects/getProject",
	async (
		{orgId, id}: {orgId: string | null | undefined; id: string},
		{rejectWithValue}
	) => {
		const result = await projectService.getProject(orgId, id);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const updateProject = createAsyncThunk(
	"projects/updateProject",
	async (
		{
			orgId,
			id,
			data,
		}: {
			orgId: string | null | undefined;
			id: string;
			data: Record<string, unknown>;
		},
		{rejectWithValue}
	) => {
		const result = await projectService.updateProject(orgId, id, data);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const deleteProject = createAsyncThunk(
	"projects/deleteProject",
	async (
		{orgId, id}: {orgId: string | null | undefined; id: string},
		{rejectWithValue}
	) => {
		const result = await projectService.deleteProject(orgId, id);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_NO_CONTENT
		) {
			return rejectWithValue(result);
		}
		return {result, id};
	}
);

// Slice

const initialState: iProjectsState = {
	items: [],
	selectedProject: null,
	fetchStatus: {...initialRequestStatus},
	createStatus: {...initialRequestStatus},
	updateStatus: {...initialRequestStatus},
	deleteStatus: {...initialRequestStatus},
	getProjectStatus: {...initialRequestStatus},
};

export const projectsSlice = createSlice({
	name: REDUCER_NAME,
	initialState,
	reducers: {
		resetProjectsState: () => initialState,
		clearSelectedProject: (state) => {
			state.selectedProject = null;
		},
		clearCreateStatus: (state) => {
			state.createStatus = {...initialRequestStatus};
		},
	},
	extraReducers: (builder) => {
		// fetchProjects
		builder.addCase(fetchProjects.pending, (state) => {
			setPending(state, "fetchStatus");
		});
		builder.addCase(fetchProjects.fulfilled, (state, action) => {
			setFulfilled(state, "fetchStatus");
			state.items =
				(action.payload.data?.data as Record<string, unknown>[]) ?? [];
		});
		builder.addCase(fetchProjects.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"fetchStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// createProject
		builder.addCase(createProject.pending, (state) => {
			setPending(state, "createStatus");
		});
		builder.addCase(createProject.fulfilled, (state, action) => {
			setFulfilled(state, "createStatus", httpStatusCodes.SUCCESS_CREATED);
			const newProject = action.payload.data?.data as Record<string, unknown>;
			if (newProject) {
				state.items.push(newProject);
			}
		});
		builder.addCase(createProject.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"createStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// getProject
		builder.addCase(getProject.pending, (state) => {
			setPending(state, "getProjectStatus");
		});
		builder.addCase(getProject.fulfilled, (state, action) => {
			setFulfilled(state, "getProjectStatus");
			state.selectedProject =
				(action.payload.data?.data as Record<string, unknown>) ?? null;
		});
		builder.addCase(getProject.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"getProjectStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// updateProject
		builder.addCase(updateProject.pending, (state) => {
			setPending(state, "updateStatus");
		});
		builder.addCase(updateProject.fulfilled, (state, action) => {
			setFulfilled(state, "updateStatus");
			const updated = action.payload.data?.data as Record<string, unknown>;
			if (updated) {
				const index = state.items.findIndex((item) => item.id === updated.id);
				if (index !== -1) {
					state.items[index] = updated;
				}
				if (state.selectedProject?.id === updated.id) {
					state.selectedProject = updated;
				}
			}
		});
		builder.addCase(updateProject.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"updateStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// deleteProject
		builder.addCase(deleteProject.pending, (state) => {
			setPending(state, "deleteStatus");
		});
		builder.addCase(deleteProject.fulfilled, (state, action) => {
			setFulfilled(state, "deleteStatus", httpStatusCodes.SUCCESS_NO_CONTENT);
			state.items = state.items.filter((item) => item.id !== action.payload.id);
			if (state.selectedProject?.id === action.payload.id) {
				state.selectedProject = null;
			}
		});
		builder.addCase(deleteProject.rejected, (state, action) => {
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

export const {resetProjectsState, clearSelectedProject, clearCreateStatus} =
	projectsSlice.actions;

export default projectsSlice.reducer;
