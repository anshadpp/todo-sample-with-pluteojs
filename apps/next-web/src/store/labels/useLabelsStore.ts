import {create} from "zustand";
import {devtools} from "zustand/middleware";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {labelService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPendingImm,
	setFulfilledImm,
	setRejectedImm,
} from "../common/RequestStatusHelpers";
import type {iLabelsState} from "./Types";

interface LabelsStore extends iLabelsState {
	fetchLabels: (projectId: string) => Promise<void>;
	createLabel: (
		projectId: string,
		data: Record<string, unknown>
	) => Promise<void>;
	addLabelToTask: (taskId: string, labelId: string) => Promise<void>;
	removeLabelFromTask: (taskId: string, labelId: string) => Promise<void>;
	resetLabelsState: () => void;
}

const initialState: iLabelsState = {
	items: [],
	fetchStatus: {...initialRequestStatus},
	createStatus: {...initialRequestStatus},
	addLabelStatus: {...initialRequestStatus},
	removeLabelStatus: {...initialRequestStatus},
};

export const useLabelsStore = create<LabelsStore>()(
	devtools(
		(set, get) => ({
			...initialState,

			fetchLabels: async (projectId) => {
				set({fetchStatus: setPendingImm()});
				const result = await labelService.getLabels(projectId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						items: (result.data as unknown as Record<string, unknown>[]) ?? [],
						fetchStatus: setFulfilledImm(),
					});
				} else {
					set({
						fetchStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			createLabel: async (projectId, data) => {
				set({createStatus: setPendingImm()});
				const result = await labelService.createLabel(projectId, data);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_CREATED
				) {
					const newLabel = result.data as unknown as Record<string, unknown>;
					set({
						createStatus: setFulfilledImm(httpStatusCodes.SUCCESS_CREATED),
						items: newLabel ? [...get().items, newLabel] : get().items,
					});
				} else {
					set({
						createStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			addLabelToTask: async (taskId, labelId) => {
				set({addLabelStatus: setPendingImm()});
				const result = await labelService.addLabelToTask(taskId, labelId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({addLabelStatus: setFulfilledImm()});
				} else {
					set({
						addLabelStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			removeLabelFromTask: async (taskId, labelId) => {
				set({removeLabelStatus: setPendingImm()});
				const result = await labelService.removeLabelFromTask(taskId, labelId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({removeLabelStatus: setFulfilledImm()});
				} else {
					set({
						removeLabelStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			resetLabelsState: () => set({...initialState}),
		}),
		{name: "labelsStore"}
	)
);
