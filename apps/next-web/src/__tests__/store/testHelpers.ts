import {configureStore} from "@reduxjs/toolkit";
import {vi} from "vitest";

import rootReducer from "@/store/RootReducer";
import {apiResponseStatuses} from "@/customTypes/NetworkTypes";

export function createTestStore(
	preloadedState?: Partial<ReturnType<typeof rootReducer>>
) {
	return configureStore({
		reducer: rootReducer,
		preloadedState: preloadedState as ReturnType<typeof rootReducer>,
		middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
	});
}

export type TestStore = ReturnType<typeof createTestStore>;

/** Build a successful APIResponse mock */
export function mockSuccessResponse<T>(data: T, httpStatusCode = 200) {
	return {
		error: null,
		httpStatusCode,
		message: null,
		data: {
			error: null,
			meta: {URID: null, paginationInfo: null},
			data,
		},
	};
}

/** Build a failed APIResponse mock */
export function mockErrorResponse(message = "Error", httpStatusCode = 500) {
	return {
		error: message,
		httpStatusCode,
		message,
		data: null,
	};
}

/** Assert that a request status is in IDLE state */
export function expectIdle(status: {
	isLoading: boolean;
	responseStatus: string;
}) {
	expect(status.isLoading).toBe(false);
	expect(status.responseStatus).toBe(apiResponseStatuses.IDLE);
}

/** Assert that a request status is loading */
export function expectLoading(status: {
	isLoading: boolean;
	responseStatus: string;
}) {
	expect(status.isLoading).toBe(true);
	expect(status.responseStatus).toBe(apiResponseStatuses.IDLE);
}

/** Assert that a request status is success */
export function expectSuccess(status: {
	isLoading: boolean;
	responseStatus: string;
}) {
	expect(status.isLoading).toBe(false);
	expect(status.responseStatus).toBe(apiResponseStatuses.SUCCESS);
}

/** Assert that a request status is error */
export function expectError(status: {
	isLoading: boolean;
	responseStatus: string;
	message: string | null;
}) {
	expect(status.isLoading).toBe(false);
	expect(status.responseStatus).toBe(apiResponseStatuses.ERROR);
}

// Re-export vi for convenience
export {vi};
