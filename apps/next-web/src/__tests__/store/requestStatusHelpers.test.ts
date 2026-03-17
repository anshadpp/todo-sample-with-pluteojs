import {describe, it, expect} from "vitest";

import {
	initialRequestStatus,
	setPending,
	setFulfilled,
	setRejected,
} from "@/store/common/RequestStatusHelpers";
import {apiResponseStatuses, httpStatusCodes} from "@/customTypes/NetworkTypes";

describe("RequestStatusHelpers", () => {
	describe("initialRequestStatus", () => {
		it("should have correct defaults", () => {
			expect(initialRequestStatus).toEqual({
				isLoading: false,
				httpStatusCode: null,
				message: null,
				responseStatus: apiResponseStatuses.IDLE,
			});
		});
	});

	describe("setPending", () => {
		it("should set loading state", () => {
			const state = {status: {...initialRequestStatus}};
			setPending(state, "status");
			expect(state.status.isLoading).toBe(true);
			expect(state.status.responseStatus).toBe(apiResponseStatuses.IDLE);
			expect(state.status.httpStatusCode).toBeNull();
			expect(state.status.message).toBeNull();
		});
	});

	describe("setFulfilled", () => {
		it("should set success state with default status code", () => {
			const state = {status: {...initialRequestStatus, isLoading: true}};
			setFulfilled(state, "status");
			expect(state.status.isLoading).toBe(false);
			expect(state.status.responseStatus).toBe(apiResponseStatuses.SUCCESS);
			expect(state.status.httpStatusCode).toBe(httpStatusCodes.SUCCESS_OK);
		});

		it("should set success state with custom status code", () => {
			const state = {status: {...initialRequestStatus}};
			setFulfilled(state, "status", httpStatusCodes.SUCCESS_CREATED);
			expect(state.status.httpStatusCode).toBe(httpStatusCodes.SUCCESS_CREATED);
		});
	});

	describe("setRejected", () => {
		it("should set error state", () => {
			const state = {status: {...initialRequestStatus}};
			setRejected(state, "status", "Something went wrong", 500);
			expect(state.status.isLoading).toBe(false);
			expect(state.status.responseStatus).toBe(apiResponseStatuses.ERROR);
			expect(state.status.message).toBe("Something went wrong");
			expect(state.status.httpStatusCode).toBe(500);
		});

		it("should use default error message when none provided", () => {
			const state = {status: {...initialRequestStatus}};
			setRejected(state, "status");
			expect(state.status.message).toBe("An error occurred");
		});
	});
});
