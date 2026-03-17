import {describe, it, expect, vi, beforeEach} from "vitest";

import {
	createTestStore,
	mockSuccessResponse,
	expectSuccess,
	TestStore,
} from "./testHelpers";
import {
	fetchNotifications,
	fetchUnreadCount,
	markAsRead,
	markAllAsRead,
	resetNotificationsState,
} from "@/store/notifications/NotificationsSlice";

vi.mock("@/services/api/PluteoJS", () => ({
	notificationService: {
		getNotifications: vi.fn(),
		getUnreadCount: vi.fn(),
		markAsRead: vi.fn(),
		markAllAsRead: vi.fn(),
	},
}));

import {notificationService} from "@/services/api/PluteoJS";

const mockNotif1 = {id: "n-1", message: "New task", read: false};
const mockNotif2 = {id: "n-2", message: "Comment", read: false};

describe("NotificationsSlice", () => {
	let store: TestStore;

	beforeEach(() => {
		store = createTestStore();
		vi.clearAllMocks();
	});

	it("should fetch notifications", async () => {
		vi.mocked(notificationService.getNotifications).mockResolvedValue(
			mockSuccessResponse([mockNotif1, mockNotif2])
		);
		await store.dispatch(fetchNotifications());

		const state = store.getState().notificationsReducer;
		expectSuccess(state.fetchStatus);
		expect(state.items).toEqual([mockNotif1, mockNotif2]);
	});

	it("should fetch unread count", async () => {
		vi.mocked(notificationService.getUnreadCount).mockResolvedValue(
			mockSuccessResponse({count: 5})
		);
		await store.dispatch(fetchUnreadCount());

		const state = store.getState().notificationsReducer;
		expectSuccess(state.fetchUnreadCountStatus);
		expect(state.unreadCount).toBe(5);
	});

	it("should mark single notification as read", async () => {
		// Setup notifications
		vi.mocked(notificationService.getNotifications).mockResolvedValue(
			mockSuccessResponse([mockNotif1, mockNotif2])
		);
		await store.dispatch(fetchNotifications());

		// Set unread count
		vi.mocked(notificationService.getUnreadCount).mockResolvedValue(
			mockSuccessResponse({count: 2})
		);
		await store.dispatch(fetchUnreadCount());

		// Mark one as read
		vi.mocked(notificationService.markAsRead).mockResolvedValue(
			mockSuccessResponse({})
		);
		await store.dispatch(markAsRead("n-1"));

		const state = store.getState().notificationsReducer;
		expect(state.items[0].read).toBe(true);
		expect(state.items[1].read).toBe(false);
		expect(state.unreadCount).toBe(1);
	});

	it("should mark all notifications as read", async () => {
		vi.mocked(notificationService.getNotifications).mockResolvedValue(
			mockSuccessResponse([mockNotif1, mockNotif2])
		);
		await store.dispatch(fetchNotifications());

		vi.mocked(notificationService.getUnreadCount).mockResolvedValue(
			mockSuccessResponse({count: 2})
		);
		await store.dispatch(fetchUnreadCount());

		vi.mocked(notificationService.markAllAsRead).mockResolvedValue(
			mockSuccessResponse({})
		);
		await store.dispatch(markAllAsRead());

		const state = store.getState().notificationsReducer;
		expect(state.items.every((item) => item.read === true)).toBe(true);
		expect(state.unreadCount).toBe(0);
	});

	it("resetNotificationsState should reset", () => {
		store.dispatch(resetNotificationsState());
		const state = store.getState().notificationsReducer;
		expect(state.items).toEqual([]);
		expect(state.unreadCount).toBe(0);
	});
});
