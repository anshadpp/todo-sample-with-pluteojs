import {createSlice, createAsyncThunk, PayloadAction} from "@reduxjs/toolkit";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {organizationService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPending,
	setFulfilled,
	setRejected,
} from "../common/RequestStatusHelpers";
import {iOrganizationState, REDUCER_NAME} from "./Types";

// Thunks

export const listOrganizations = createAsyncThunk(
	"organization/listOrganizations",
	async (_, {rejectWithValue}) => {
		const result = await organizationService.listOrganizations();
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const createOrganization = createAsyncThunk(
	"organization/createOrganization",
	async (data: Record<string, unknown>, {rejectWithValue}) => {
		const result = await organizationService.createOrganization(data);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const updateOrganization = createAsyncThunk(
	"organization/updateOrganization",
	async (
		data: {organizationId: string; name?: string; slug?: string; logo?: string},
		{rejectWithValue}
	) => {
		const result = await organizationService.updateOrganization(data);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const deleteOrganization = createAsyncThunk(
	"organization/deleteOrganization",
	async (organizationId: string, {rejectWithValue}) => {
		const result = await organizationService.deleteOrganization(organizationId);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const setActiveOrganization = createAsyncThunk(
	"organization/setActiveOrganization",
	async (orgId: string, {rejectWithValue}) => {
		const result = await organizationService.setActiveOrganization(orgId);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return {result, orgId};
	}
);

export const getFullOrganization = createAsyncThunk(
	"organization/getFullOrganization",
	async (orgId: string, {rejectWithValue}) => {
		const result = await organizationService.getFullOrganization(orgId);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const inviteMember = createAsyncThunk(
	"organization/inviteMember",
	async (
		data: {organizationId: string; email: string; role: string},
		{rejectWithValue}
	) => {
		const result = await organizationService.inviteMember(data);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const acceptInvitation = createAsyncThunk(
	"organization/acceptInvitation",
	async (invitationId: string, {rejectWithValue}) => {
		const result = await organizationService.acceptInvitation(invitationId);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const rejectInvitation = createAsyncThunk(
	"organization/rejectInvitation",
	async (invitationId: string, {rejectWithValue}) => {
		const result = await organizationService.rejectInvitation(invitationId);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

// Slice

const initialState: iOrganizationState = {
	organizations: [],
	activeOrganizationId: null,
	activeOrganization: null,
	fetchStatus: {...initialRequestStatus},
	createStatus: {...initialRequestStatus},
	updateStatus: {...initialRequestStatus},
	deleteStatus: {...initialRequestStatus},
	setActiveStatus: {...initialRequestStatus},
	inviteStatus: {...initialRequestStatus},
	acceptInvitationStatus: {...initialRequestStatus},
	rejectInvitationStatus: {...initialRequestStatus},
};

export const organizationSlice = createSlice({
	name: REDUCER_NAME,
	initialState,
	reducers: {
		resetOrganizationState: () => initialState,
		setActiveOrgId: (state, action: PayloadAction<string | null>) => {
			state.activeOrganizationId = action.payload;
		},
		clearCreateStatus: (state) => {
			state.createStatus = {...initialRequestStatus};
		},
		clearInviteStatus: (state) => {
			state.inviteStatus = {...initialRequestStatus};
		},
	},
	extraReducers: (builder) => {
		// listOrganizations
		builder.addCase(listOrganizations.pending, (state) => {
			setPending(state, "fetchStatus");
		});
		builder.addCase(listOrganizations.fulfilled, (state, action) => {
			setFulfilled(state, "fetchStatus");
			state.organizations =
				(action.payload.data?.data as Record<string, unknown>[]) ?? [];
		});
		builder.addCase(listOrganizations.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"fetchStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// createOrganization
		builder.addCase(createOrganization.pending, (state) => {
			setPending(state, "createStatus");
		});
		builder.addCase(createOrganization.fulfilled, (state, action) => {
			setFulfilled(state, "createStatus");
			const newOrg = action.payload.data?.data as Record<string, unknown>;
			if (newOrg) {
				state.organizations.push(newOrg);
			}
		});
		builder.addCase(createOrganization.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"createStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// updateOrganization
		builder.addCase(updateOrganization.pending, (state) => {
			setPending(state, "updateStatus");
		});
		builder.addCase(updateOrganization.fulfilled, (state) => {
			setFulfilled(state, "updateStatus");
		});
		builder.addCase(updateOrganization.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"updateStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// deleteOrganization
		builder.addCase(deleteOrganization.pending, (state) => {
			setPending(state, "deleteStatus");
		});
		builder.addCase(deleteOrganization.fulfilled, (state) => {
			setFulfilled(state, "deleteStatus");
		});
		builder.addCase(deleteOrganization.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"deleteStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// setActiveOrganization
		builder.addCase(setActiveOrganization.pending, (state) => {
			setPending(state, "setActiveStatus");
		});
		builder.addCase(setActiveOrganization.fulfilled, (state, action) => {
			setFulfilled(state, "setActiveStatus");
			state.activeOrganizationId = action.payload.orgId;
		});
		builder.addCase(setActiveOrganization.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"setActiveStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// getFullOrganization
		builder.addCase(getFullOrganization.fulfilled, (state, action) => {
			state.activeOrganization =
				(action.payload.data?.data as Record<string, unknown>) ?? null;
		});

		// inviteMember
		builder.addCase(inviteMember.pending, (state) => {
			setPending(state, "inviteStatus");
		});
		builder.addCase(inviteMember.fulfilled, (state) => {
			setFulfilled(state, "inviteStatus");
		});
		builder.addCase(inviteMember.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"inviteStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// acceptInvitation
		builder.addCase(acceptInvitation.pending, (state) => {
			setPending(state, "acceptInvitationStatus");
		});
		builder.addCase(acceptInvitation.fulfilled, (state) => {
			setFulfilled(state, "acceptInvitationStatus");
		});
		builder.addCase(acceptInvitation.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"acceptInvitationStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// rejectInvitation
		builder.addCase(rejectInvitation.pending, (state) => {
			setPending(state, "rejectInvitationStatus");
		});
		builder.addCase(rejectInvitation.fulfilled, (state) => {
			setFulfilled(state, "rejectInvitationStatus");
		});
		builder.addCase(rejectInvitation.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"rejectInvitationStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});
	},
});

export const {
	resetOrganizationState,
	setActiveOrgId,
	clearCreateStatus,
	clearInviteStatus,
} = organizationSlice.actions;

export default organizationSlice.reducer;
