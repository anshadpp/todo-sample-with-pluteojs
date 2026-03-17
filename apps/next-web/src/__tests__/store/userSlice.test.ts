import {describe, it, expect, vi, beforeEach} from "vitest";

import {
	createTestStore,
	mockSuccessResponse,
	mockErrorResponse,
	expectSuccess,
	expectError,
	TestStore,
} from "./testHelpers";
import {
	fetchProfile,
	updateProfile,
	resetUserState,
} from "@/store/user/UserSlice";

vi.mock("@/services/api/PluteoJS", () => ({
	userService: {
		getProfile: vi.fn(),
		updateProfile: vi.fn(),
	},
}));

import {userService} from "@/services/api/PluteoJS";

const mockProfile = {
	id: "u-1",
	name: "Test User",
	email: "test@example.com",
	image: null,
};

describe("UserSlice", () => {
	let store: TestStore;

	beforeEach(() => {
		store = createTestStore();
		vi.clearAllMocks();
	});

	it("should have correct initial state", () => {
		const state = store.getState().userReducer;
		expect(state.profile).toBeNull();
	});

	it("should fetch profile", async () => {
		vi.mocked(userService.getProfile).mockResolvedValue(
			mockSuccessResponse(mockProfile)
		);
		await store.dispatch(fetchProfile());

		const state = store.getState().userReducer;
		expectSuccess(state.fetchProfileStatus);
		expect(state.profile).toEqual(mockProfile);
	});

	it("should handle fetch profile error", async () => {
		vi.mocked(userService.getProfile).mockResolvedValue(
			mockErrorResponse("Failed", 500)
		);
		await store.dispatch(fetchProfile());
		expectError(store.getState().userReducer.fetchProfileStatus);
	});

	it("should update profile", async () => {
		vi.mocked(userService.getProfile).mockResolvedValue(
			mockSuccessResponse(mockProfile)
		);
		await store.dispatch(fetchProfile());

		const updated = {...mockProfile, name: "Updated Name"};
		vi.mocked(userService.updateProfile).mockResolvedValue(
			mockSuccessResponse(updated)
		);
		await store.dispatch(updateProfile({name: "Updated Name"}));

		const state = store.getState().userReducer;
		expectSuccess(state.updateProfileStatus);
		expect(state.profile?.name).toBe("Updated Name");
	});

	it("resetUserState should reset", async () => {
		vi.mocked(userService.getProfile).mockResolvedValue(
			mockSuccessResponse(mockProfile)
		);
		await store.dispatch(fetchProfile());
		store.dispatch(resetUserState());
		expect(store.getState().userReducer.profile).toBeNull();
	});
});
