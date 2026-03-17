import {
	iAPIRequestStatus,
	apiResponseStatuses,
	httpStatusCodes,
} from "@/customTypes/NetworkTypes";

export const initialRequestStatus: iAPIRequestStatus = {
	isLoading: false,
	httpStatusCode: null,
	message: null,
	responseStatus: apiResponseStatuses.IDLE,
};

export function setPending<T>(state: T, key: keyof T): void {
	const status = state[key] as iAPIRequestStatus;
	status.isLoading = true;
	status.httpStatusCode = null;
	status.message = null;
	status.responseStatus = apiResponseStatuses.IDLE;
}

export function setFulfilled<T>(
	state: T,
	key: keyof T,
	httpStatusCode: httpStatusCodes = httpStatusCodes.SUCCESS_OK
): void {
	const status = state[key] as iAPIRequestStatus;
	status.isLoading = false;
	status.httpStatusCode = httpStatusCode;
	status.message = null;
	status.responseStatus = apiResponseStatuses.SUCCESS;
}

export function setRejected<T>(
	state: T,
	key: keyof T,
	error?: string | null,
	httpStatusCode?: number | null
): void {
	const status = state[key] as iAPIRequestStatus;
	status.isLoading = false;
	status.httpStatusCode = httpStatusCode ?? null;
	status.message = error ?? "An error occurred";
	status.responseStatus = apiResponseStatuses.ERROR;
}

export function setPendingImm(): iAPIRequestStatus {
	return {
		isLoading: true,
		httpStatusCode: null,
		message: null,
		responseStatus: apiResponseStatuses.IDLE,
	};
}

export function setFulfilledImm(
	httpStatusCode: httpStatusCodes = httpStatusCodes.SUCCESS_OK
): iAPIRequestStatus {
	return {
		isLoading: false,
		httpStatusCode,
		message: null,
		responseStatus: apiResponseStatuses.SUCCESS,
	};
}

export function setRejectedImm(
	error?: string | null,
	httpStatusCode?: number | null
): iAPIRequestStatus {
	return {
		isLoading: false,
		httpStatusCode: httpStatusCode ?? null,
		message: error ?? "An error occurred",
		responseStatus: apiResponseStatuses.ERROR,
	};
}
