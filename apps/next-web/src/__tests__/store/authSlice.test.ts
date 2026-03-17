import {describe, it, expect, vi, beforeEach} from "vitest";

import {
	createTestStore,
	mockSuccessResponse,
	mockErrorResponse,
	expectIdle,
	expectLoading,
	expectSuccess,
	expectError,
	TestStore,
} from "./testHelpers";
import {
	signIn,
	signUp,
	signOut,
	getSession,
	resetAuthState,
	clearSignInStatus,
	clearSignUpStatus,
} from "@/store/auth/AuthSlice";

const mockUser = {
	id: "user-1",
	name: "Test User",
	email: "test@example.com",
	emailVerified: true,
	image: null,
	createdAt: "2024-01-01",
	updatedAt: "2024-01-01",
};

vi.mock("@/services/api/PluteoJS", () => ({
	authService: {
		signIn: vi.fn(),
		signUp: vi.fn(),
		signOut: vi.fn(),
		getSession: vi.fn(),
	},
}));

import {authService} from "@/services/api/PluteoJS";

describe("AuthSlice", () => {
	let store: TestStore;

	beforeEach(() => {
		store = createTestStore();
		vi.clearAllMocks();
	});

	describe("initial state", () => {
		it("should have correct initial state", () => {
			const state = store.getState().authReducer;
			expect(state.user).toBeNull();
			expect(state.isAuthenticated).toBe(false);
			expectIdle(state.sessionStatus);
			expectIdle(state.signInStatus);
			expectIdle(state.signUpStatus);
			expectIdle(state.signOutStatus);
		});
	});

	describe("signIn", () => {
		it("should handle successful sign in", async () => {
			vi.mocked(authService.signIn).mockResolvedValue(
				mockSuccessResponse({token: "t", user: mockUser})
			);

			await store.dispatch(
				signIn({email: "test@example.com", password: "pass"})
			);

			const state = store.getState().authReducer;
			expectSuccess(state.signInStatus);
			expect(state.user).toEqual(mockUser);
			expect(state.isAuthenticated).toBe(true);
		});

		it("should handle pending state", () => {
			vi.mocked(authService.signIn).mockReturnValue(new Promise(() => {}));
			store.dispatch(signIn({email: "test@example.com", password: "pass"}));

			const state = store.getState().authReducer;
			expectLoading(state.signInStatus);
		});

		it("should handle failed sign in", async () => {
			vi.mocked(authService.signIn).mockResolvedValue(
				mockErrorResponse("Invalid credentials", 401)
			);

			await store.dispatch(
				signIn({email: "test@example.com", password: "wrong"})
			);

			const state = store.getState().authReducer;
			expectError(state.signInStatus);
			expect(state.isAuthenticated).toBe(false);
		});
	});

	describe("signUp", () => {
		it("should handle successful sign up", async () => {
			vi.mocked(authService.signUp).mockResolvedValue(
				mockSuccessResponse({token: "t", user: mockUser}, 201)
			);

			await store.dispatch(
				signUp({name: "Test", email: "test@example.com", password: "pass"})
			);

			const state = store.getState().authReducer;
			expectSuccess(state.signUpStatus);
			expect(state.user).toEqual(mockUser);
			expect(state.isAuthenticated).toBe(true);
		});

		it("should handle failed sign up", async () => {
			vi.mocked(authService.signUp).mockResolvedValue(
				mockErrorResponse("Email taken", 400)
			);

			await store.dispatch(
				signUp({name: "Test", email: "test@example.com", password: "pass"})
			);

			const state = store.getState().authReducer;
			expectError(state.signUpStatus);
		});
	});

	describe("signOut", () => {
		it("should reset state on sign out", async () => {
			// First sign in
			vi.mocked(authService.signIn).mockResolvedValue(
				mockSuccessResponse({token: "t", user: mockUser})
			);
			await store.dispatch(
				signIn({email: "test@example.com", password: "pass"})
			);
			expect(store.getState().authReducer.isAuthenticated).toBe(true);

			// Then sign out
			vi.mocked(authService.signOut).mockResolvedValue(undefined);
			await store.dispatch(signOut());

			const state = store.getState().authReducer;
			expect(state.user).toBeNull();
			expect(state.isAuthenticated).toBe(false);
		});
	});

	describe("getSession", () => {
		it("should handle successful session fetch", async () => {
			vi.mocked(authService.getSession).mockResolvedValue(
				mockSuccessResponse({user: mockUser})
			);

			await store.dispatch(getSession());

			const state = store.getState().authReducer;
			expectSuccess(state.sessionStatus);
			expect(state.user).toEqual(mockUser);
			expect(state.isAuthenticated).toBe(true);
		});

		it("should handle failed session (not authenticated)", async () => {
			vi.mocked(authService.getSession).mockResolvedValue(
				mockErrorResponse("Not authenticated", 401)
			);

			await store.dispatch(getSession());

			const state = store.getState().authReducer;
			expectError(state.sessionStatus);
			expect(state.user).toBeNull();
			expect(state.isAuthenticated).toBe(false);
		});
	});

	describe("sync reducers", () => {
		it("resetAuthState should reset to initial", async () => {
			vi.mocked(authService.signIn).mockResolvedValue(
				mockSuccessResponse({token: "t", user: mockUser})
			);
			await store.dispatch(
				signIn({email: "test@example.com", password: "pass"})
			);

			store.dispatch(resetAuthState());
			const state = store.getState().authReducer;
			expect(state.user).toBeNull();
			expect(state.isAuthenticated).toBe(false);
		});

		it("clearSignInStatus should reset signInStatus", async () => {
			vi.mocked(authService.signIn).mockResolvedValue(
				mockErrorResponse("Fail", 401)
			);
			await store.dispatch(signIn({email: "e", password: "p"}));

			store.dispatch(clearSignInStatus());
			expectIdle(store.getState().authReducer.signInStatus);
		});

		it("clearSignUpStatus should reset signUpStatus", async () => {
			vi.mocked(authService.signUp).mockResolvedValue(
				mockErrorResponse("Fail", 400)
			);
			await store.dispatch(signUp({name: "n", email: "e", password: "p"}));

			store.dispatch(clearSignUpStatus());
			expectIdle(store.getState().authReducer.signUpStatus);
		});
	});
});
