import {create} from "zustand";
import {devtools} from "zustand/middleware";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {autoSortRuleService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPendingImm,
	setFulfilledImm,
	setRejectedImm,
} from "../common/RequestStatusHelpers";
import type {iAutoSortRulesState} from "./Types";

interface AutoSortRulesStore extends iAutoSortRulesState {
	fetchRules: (projectId: string) => Promise<void>;
	createRule: (
		projectId: string,
		data: Record<string, unknown>
	) => Promise<void>;
	updateRule: (ruleId: string, data: Record<string, unknown>) => Promise<void>;
	deleteRule: (ruleId: string) => Promise<void>;
	evaluateRules: (projectId: string) => Promise<void>;
	resetAutoSortRulesState: () => void;
}

const initialState: iAutoSortRulesState = {
	items: [],
	fetchStatus: {...initialRequestStatus},
	createStatus: {...initialRequestStatus},
	updateStatus: {...initialRequestStatus},
	deleteStatus: {...initialRequestStatus},
	evaluateStatus: {...initialRequestStatus},
};

export const useAutoSortRulesStore = create<AutoSortRulesStore>()(
	devtools(
		(set, get) => ({
			...initialState,

			fetchRules: async (projectId) => {
				set({fetchStatus: setPendingImm()});
				const result = await autoSortRuleService.getRules(projectId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						items: (result.data?.data as Record<string, unknown>[]) ?? [],
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

			createRule: async (projectId, data) => {
				set({createStatus: setPendingImm()});
				const result = await autoSortRuleService.createRule(projectId, data);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_CREATED
				) {
					const newRule = result.data?.data as Record<string, unknown>;
					set({
						createStatus: setFulfilledImm(httpStatusCodes.SUCCESS_CREATED),
						items: newRule ? [...get().items, newRule] : get().items,
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

			updateRule: async (ruleId, data) => {
				set({updateStatus: setPendingImm()});
				const result = await autoSortRuleService.updateRule(ruleId, data);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({updateStatus: setFulfilledImm()});
				} else {
					set({
						updateStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			deleteRule: async (ruleId) => {
				set({deleteStatus: setPendingImm()});
				const result = await autoSortRuleService.deleteRule(ruleId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_NO_CONTENT
				) {
					set({
						deleteStatus: setFulfilledImm(httpStatusCodes.SUCCESS_NO_CONTENT),
						items: get().items.filter(
							(item) => (item as {id: string}).id !== ruleId
						),
					});
				} else {
					set({
						deleteStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			evaluateRules: async (projectId) => {
				set({evaluateStatus: setPendingImm()});
				const result = await autoSortRuleService.evaluateRules(projectId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({evaluateStatus: setFulfilledImm()});
				} else {
					set({
						evaluateStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			resetAutoSortRulesState: () => set({...initialState}),
		}),
		{name: "autoSortRulesStore"}
	)
);
