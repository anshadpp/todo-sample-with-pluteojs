import {describe, it, expect, vi, beforeEach} from "vitest";

import {
	createTestStore,
	mockSuccessResponse,
	expectSuccess,
	TestStore,
} from "./testHelpers";
import {
	fetchLabels,
	createLabel,
	addLabelToTask,
	removeLabelFromTask,
	resetLabelsState,
} from "@/store/labels/LabelsSlice";

vi.mock("@/services/api/PluteoJS", () => ({
	labelService: {
		getLabels: vi.fn(),
		createLabel: vi.fn(),
		addLabelToTask: vi.fn(),
		removeLabelFromTask: vi.fn(),
	},
}));

import {labelService} from "@/services/api/PluteoJS";

const mockLabel = {id: "l-1", name: "Bug", color: "#ff0000"};

describe("LabelsSlice", () => {
	let store: TestStore;

	beforeEach(() => {
		store = createTestStore();
		vi.clearAllMocks();
	});

	it("should fetch labels", async () => {
		vi.mocked(labelService.getLabels).mockResolvedValue(
			mockSuccessResponse([mockLabel])
		);
		await store.dispatch(fetchLabels("p-1"));

		const state = store.getState().labelsReducer;
		expectSuccess(state.fetchStatus);
		expect(state.items).toEqual([mockLabel]);
	});

	it("should create and append label", async () => {
		vi.mocked(labelService.createLabel).mockResolvedValue(
			mockSuccessResponse(mockLabel, 201)
		);
		await store.dispatch(createLabel({projectId: "p-1", data: {name: "Bug"}}));
		expect(store.getState().labelsReducer.items).toHaveLength(1);
	});

	it("should add label to task", async () => {
		vi.mocked(labelService.addLabelToTask).mockResolvedValue(
			mockSuccessResponse({})
		);
		await store.dispatch(addLabelToTask({taskId: "t-1", labelId: "l-1"}));
		expectSuccess(store.getState().labelsReducer.addToTaskStatus);
	});

	it("should remove label from task", async () => {
		vi.mocked(labelService.removeLabelFromTask).mockResolvedValue({
			error: null,
			httpStatusCode: 204,
			message: null,
			data: null,
		});
		await store.dispatch(removeLabelFromTask({taskId: "t-1", labelId: "l-1"}));
		expectSuccess(store.getState().labelsReducer.removeFromTaskStatus);
	});

	it("resetLabelsState should reset", async () => {
		vi.mocked(labelService.getLabels).mockResolvedValue(
			mockSuccessResponse([mockLabel])
		);
		await store.dispatch(fetchLabels("p-1"));
		store.dispatch(resetLabelsState());
		expect(store.getState().labelsReducer.items).toEqual([]);
	});
});
