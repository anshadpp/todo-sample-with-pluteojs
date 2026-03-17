import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {notificationService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPending,
	setFulfilled,
	setRejected,
} from "../common/RequestStatusHelpers";
import {iNotificationsState, REDUCER_NAME} from "./Types";

// Thunks

export const fetchNotifications = createAsyncThunk(
	"notifications/fetchNotifications",
	async (_, {rejectWithValue}) => {
		const result = await notificationService.getNotifications();
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const fetchUnreadCount = createAsyncThunk(
	"notifications/fetchUnreadCount",
	async (_, {rejectWithValue}) => {
		const result = await notificationService.getUnreadCount();
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const markAsRead = createAsyncThunk(
	"notifications/markAsRead",
	async (id: string, {rejectWithValue}) => {
		const result = await notificationService.markAsRead(id);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return {result, id};
	}
);

export const markAllAsRead = createAsyncThunk(
	"notifications/markAllAsRead",
	async (_, {rejectWithValue}) => {
		const result = await notificationService.markAllAsRead();
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

// Slice

const initialState: iNotificationsState = {
	items: [],
	unreadCount: 0,
	fetchStatus: {...initialRequestStatus},
	fetchUnreadCountStatus: {...initialRequestStatus},
	markAsReadStatus: {...initialRequestStatus},
	markAllAsReadStatus: {...initialRequestStatus},
};

export const notificationsSlice = createSlice({
	name: REDUCER_NAME,
	initialState,
	reducers: {
		resetNotificationsState: () => initialState,
	},
	extraReducers: (builder) => {
		// fetchNotifications
		builder.addCase(fetchNotifications.pending, (state) => {
			setPending(state, "fetchStatus");
		});
		builder.addCase(fetchNotifications.fulfilled, (state, action) => {
			setFulfilled(state, "fetchStatus");
			state.items =
				(action.payload.data?.data as Record<string, unknown>[]) ?? [];
		});
		builder.addCase(fetchNotifications.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"fetchStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// fetchUnreadCount
		builder.addCase(fetchUnreadCount.pending, (state) => {
			setPending(state, "fetchUnreadCountStatus");
		});
		builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
			setFulfilled(state, "fetchUnreadCountStatus");
			const data = action.payload.data?.data as Record<string, unknown>;
			state.unreadCount = (data?.count as number) ?? 0;
		});
		builder.addCase(fetchUnreadCount.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"fetchUnreadCountStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// markAsRead
		builder.addCase(markAsRead.pending, (state) => {
			setPending(state, "markAsReadStatus");
		});
		builder.addCase(markAsRead.fulfilled, (state, action) => {
			setFulfilled(state, "markAsReadStatus");
			const index = state.items.findIndex(
				(item) => item.id === action.payload.id
			);
			if (index !== -1) {
				state.items[index] = {...state.items[index], read: true};
			}
			if (state.unreadCount > 0) {
				state.unreadCount -= 1;
			}
		});
		builder.addCase(markAsRead.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"markAsReadStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// markAllAsRead
		builder.addCase(markAllAsRead.pending, (state) => {
			setPending(state, "markAllAsReadStatus");
		});
		builder.addCase(markAllAsRead.fulfilled, (state) => {
			setFulfilled(state, "markAllAsReadStatus");
			state.items = state.items.map((item) => ({...item, read: true}));
			state.unreadCount = 0;
		});
		builder.addCase(markAllAsRead.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"markAllAsReadStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});
	},
});

export const {resetNotificationsState} = notificationsSlice.actions;

export default notificationsSlice.reducer;
