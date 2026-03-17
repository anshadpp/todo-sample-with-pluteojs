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
	fetchAutoSortRules,
	createAutoSortRule,
	updateAutoSortRule,
	deleteAutoSortRule,
	evaluateAutoSortRules,
	resetAutoSortRulesState,
} from "@/store/autoSortRules/AutoSortRulesSlice";

vi.mock("@/services/api/PluteoJS", () => ({
	autoSortRuleService: {
		getRules: vi.fn(),
		createRule: vi.fn(),
		updateRule: vi.fn(),
		deleteRule: vi.fn(),
		evaluateRules: vi.fn(),
	},
}));

import {autoSortRuleService} from "@/services/api/PluteoJS";

const mockRule = {id: "r-1", name: "Priority Sort", field: "priority"};
const mockRule2 = {id: "r-2", name: "Date Sort", field: "dueDate"};

describe("AutoSortRulesSlice", () => {
	let store: TestStore;

	beforeEach(() => {
		store = createTestStore();
		vi.clearAllMocks();
	});

	it("should fetch rules", async () => {
		vi.mocked(autoSortRuleService.getRules).mockResolvedValue(
			mockSuccessResponse([mockRule, mockRule2])
		);
		await store.dispatch(fetchAutoSortRules("p-1"));

		const state = store.getState().autoSortRulesReducer;
		expectSuccess(state.fetchStatus);
		expect(state.items).toEqual([mockRule, mockRule2]);
	});

	it("should create and append rule", async () => {
		vi.mocked(autoSortRuleService.createRule).mockResolvedValue(
			mockSuccessResponse(mockRule, 201)
		);
		await store.dispatch(
			createAutoSortRule({projectId: "p-1", ruleData: {name: "New"}})
		);
		expect(store.getState().autoSortRulesReducer.items).toHaveLength(1);
	});

	it("should update rule in list", async () => {
		vi.mocked(autoSortRuleService.getRules).mockResolvedValue(
			mockSuccessResponse([mockRule])
		);
		await store.dispatch(fetchAutoSortRules("p-1"));

		const updated = {...mockRule, name: "Updated"};
		vi.mocked(autoSortRuleService.updateRule).mockResolvedValue(
			mockSuccessResponse(updated)
		);
		await store.dispatch(
			updateAutoSortRule({ruleId: "r-1", ruleData: {name: "Updated"}})
		);

		expect(store.getState().autoSortRulesReducer.items[0].name).toBe("Updated");
	});

	it("should delete rule", async () => {
		vi.mocked(autoSortRuleService.getRules).mockResolvedValue(
			mockSuccessResponse([mockRule, mockRule2])
		);
		await store.dispatch(fetchAutoSortRules("p-1"));

		vi.mocked(autoSortRuleService.deleteRule).mockResolvedValue({
			error: null,
			httpStatusCode: 204,
			message: null,
			data: null,
		});
		await store.dispatch(deleteAutoSortRule("r-1"));

		expect(store.getState().autoSortRulesReducer.items).toHaveLength(1);
		expect(store.getState().autoSortRulesReducer.items[0].id).toBe("r-2");
	});

	it("should evaluate rules", async () => {
		vi.mocked(autoSortRuleService.evaluateRules).mockResolvedValue(
			mockSuccessResponse({tasksReordered: 5})
		);
		await store.dispatch(evaluateAutoSortRules("p-1"));
		expectSuccess(store.getState().autoSortRulesReducer.evaluateStatus);
	});

	it("should handle error", async () => {
		vi.mocked(autoSortRuleService.getRules).mockResolvedValue(
			mockErrorResponse("Failed", 500)
		);
		await store.dispatch(fetchAutoSortRules("p-1"));
		expectError(store.getState().autoSortRulesReducer.fetchStatus);
	});

	it("resetAutoSortRulesState should reset", async () => {
		vi.mocked(autoSortRuleService.getRules).mockResolvedValue(
			mockSuccessResponse([mockRule])
		);
		await store.dispatch(fetchAutoSortRules("p-1"));
		store.dispatch(resetAutoSortRulesState());
		expect(store.getState().autoSortRulesReducer.items).toEqual([]);
	});
});
