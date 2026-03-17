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
	fetchTasks,
	createTask,
	getTask,
	updateTask,
	moveTask,
	reorderTasks,
	deleteTask,
	resetTasksState,
	clearSelectedTask,
} from "@/store/tasks/TasksSlice";

vi.mock("@/services/api/PluteoJS", () => ({
	taskService: {
		getTasks: vi.fn(),
		createTask: vi.fn(),
		getTask: vi.fn(),
		updateTask: vi.fn(),
		moveTask: vi.fn(),
		reorderTasks: vi.fn(),
		deleteTask: vi.fn(),
	},
}));

import {taskService} from "@/services/api/PluteoJS";

const mockTask = {id: "t-1", title: "Task 1", status: "todo"};
const mockTask2 = {id: "t-2", title: "Task 2", status: "in-progress"};

describe("TasksSlice", () => {
	let store: TestStore;

	beforeEach(() => {
		store = createTestStore();
		vi.clearAllMocks();
	});

	describe("fetchTasks", () => {
		it("should fetch tasks", async () => {
			vi.mocked(taskService.getTasks).mockResolvedValue(
				mockSuccessResponse([mockTask, mockTask2])
			);
			await store.dispatch(fetchTasks("p-1"));
			const state = store.getState().tasksReducer;
			expectSuccess(state.fetchStatus);
			expect(state.items).toEqual([mockTask, mockTask2]);
		});
	});

	describe("createTask", () => {
		it("should create and append task", async () => {
			vi.mocked(taskService.createTask).mockResolvedValue(
				mockSuccessResponse(mockTask, 201)
			);
			await store.dispatch(
				createTask({projectId: "p-1", data: {title: "New"}})
			);
			expect(store.getState().tasksReducer.items).toHaveLength(1);
		});
	});

	describe("getTask", () => {
		it("should set selectedTask", async () => {
			vi.mocked(taskService.getTask).mockResolvedValue(
				mockSuccessResponse(mockTask)
			);
			await store.dispatch(getTask("t-1"));
			expect(store.getState().tasksReducer.selectedTask).toEqual(mockTask);
		});
	});

	describe("updateTask", () => {
		it("should update task in list and selectedTask", async () => {
			vi.mocked(taskService.getTasks).mockResolvedValue(
				mockSuccessResponse([mockTask])
			);
			await store.dispatch(fetchTasks("p-1"));
			vi.mocked(taskService.getTask).mockResolvedValue(
				mockSuccessResponse(mockTask)
			);
			await store.dispatch(getTask("t-1"));

			const updated = {...mockTask, title: "Updated"};
			vi.mocked(taskService.updateTask).mockResolvedValue(
				mockSuccessResponse(updated)
			);
			await store.dispatch(
				updateTask({taskId: "t-1", data: {title: "Updated"}})
			);

			const state = store.getState().tasksReducer;
			expect(state.items[0].title).toBe("Updated");
			expect(state.selectedTask?.title).toBe("Updated");
		});
	});

	describe("moveTask", () => {
		it("should handle move success", async () => {
			vi.mocked(taskService.moveTask).mockResolvedValue(
				mockSuccessResponse({})
			);
			await store.dispatch(
				moveTask({taskId: "t-1", data: {categoryId: "c-2"}})
			);
			expectSuccess(store.getState().tasksReducer.moveStatus);
		});
	});

	describe("reorderTasks", () => {
		it("should handle reorder success", async () => {
			vi.mocked(taskService.reorderTasks).mockResolvedValue(
				mockSuccessResponse({})
			);
			await store.dispatch(reorderTasks([{id: "t-2"}, {id: "t-1"}]));
			expectSuccess(store.getState().tasksReducer.reorderStatus);
		});
	});

	describe("deleteTask", () => {
		it("should remove task from list", async () => {
			vi.mocked(taskService.getTasks).mockResolvedValue(
				mockSuccessResponse([mockTask, mockTask2])
			);
			await store.dispatch(fetchTasks("p-1"));

			vi.mocked(taskService.deleteTask).mockResolvedValue({
				error: null,
				httpStatusCode: 204,
				message: null,
				data: null,
			});
			await store.dispatch(deleteTask("t-1"));

			expect(store.getState().tasksReducer.items).toHaveLength(1);
			expect(store.getState().tasksReducer.items[0].id).toBe("t-2");
		});

		it("should clear selectedTask if deleted", async () => {
			vi.mocked(taskService.getTask).mockResolvedValue(
				mockSuccessResponse(mockTask)
			);
			await store.dispatch(getTask("t-1"));

			vi.mocked(taskService.deleteTask).mockResolvedValue({
				error: null,
				httpStatusCode: 204,
				message: null,
				data: null,
			});
			await store.dispatch(deleteTask("t-1"));
			expect(store.getState().tasksReducer.selectedTask).toBeNull();
		});
	});

	describe("sync reducers", () => {
		it("resetTasksState", () => {
			store.dispatch(resetTasksState());
			expect(store.getState().tasksReducer.items).toEqual([]);
		});

		it("clearSelectedTask", async () => {
			vi.mocked(taskService.getTask).mockResolvedValue(
				mockSuccessResponse(mockTask)
			);
			await store.dispatch(getTask("t-1"));
			store.dispatch(clearSelectedTask());
			expect(store.getState().tasksReducer.selectedTask).toBeNull();
		});
	});
});
