import {describe, it, expect, vi, beforeEach} from "vitest";

import {
	createTestStore,
	mockSuccessResponse,
	expectSuccess,
	TestStore,
} from "./testHelpers";
import {
	fetchTodos,
	createTodo,
	updateTodo,
	deleteTodo,
	resetTodosState,
} from "@/store/todos/TodosSlice";

vi.mock("@/services/api/PluteoJS", () => ({
	todoService: {
		getTodos: vi.fn(),
		createTodo: vi.fn(),
		updateTodo: vi.fn(),
		deleteTodo: vi.fn(),
	},
}));

import {todoService} from "@/services/api/PluteoJS";

const mockTodo = {
	id: "td-1",
	userId: "u-1",
	title: "Buy groceries",
	description: null,
	completed: false,
	dueAt: null,
	notifyAt: null,
	notified: false,
	createdAt: "2024-01-01",
	updatedAt: "2024-01-01",
};

const mockTodo2 = {
	...mockTodo,
	id: "td-2",
	title: "Walk the dog",
};

describe("TodosSlice", () => {
	let store: TestStore;

	beforeEach(() => {
		store = createTestStore();
		vi.clearAllMocks();
	});

	it("should fetch todos", async () => {
		vi.mocked(todoService.getTodos).mockResolvedValue(
			mockSuccessResponse([mockTodo, mockTodo2])
		);
		await store.dispatch(fetchTodos());

		const state = store.getState().todosReducer;
		expectSuccess(state.fetchStatus);
		expect(state.items).toEqual([mockTodo, mockTodo2]);
	});

	it("should create and append todo", async () => {
		vi.mocked(todoService.createTodo).mockResolvedValue(
			mockSuccessResponse(mockTodo, 201)
		);
		await store.dispatch(createTodo({title: "New todo"}));
		expect(store.getState().todosReducer.items).toHaveLength(1);
	});

	it("should update todo in list", async () => {
		vi.mocked(todoService.getTodos).mockResolvedValue(
			mockSuccessResponse([mockTodo])
		);
		await store.dispatch(fetchTodos());

		const updated = {...mockTodo, completed: true};
		vi.mocked(todoService.updateTodo).mockResolvedValue(
			mockSuccessResponse(updated)
		);
		await store.dispatch(
			updateTodo({todoId: "td-1", input: {completed: true}})
		);

		expect(store.getState().todosReducer.items[0].completed).toBe(true);
	});

	it("should delete todo", async () => {
		vi.mocked(todoService.getTodos).mockResolvedValue(
			mockSuccessResponse([mockTodo, mockTodo2])
		);
		await store.dispatch(fetchTodos());

		vi.mocked(todoService.deleteTodo).mockResolvedValue({
			error: null,
			httpStatusCode: 204,
			message: null,
			data: null,
		});
		await store.dispatch(deleteTodo("td-1"));

		expect(store.getState().todosReducer.items).toHaveLength(1);
		expect(store.getState().todosReducer.items[0].id).toBe("td-2");
	});

	it("resetTodosState should reset", async () => {
		vi.mocked(todoService.getTodos).mockResolvedValue(
			mockSuccessResponse([mockTodo])
		);
		await store.dispatch(fetchTodos());
		store.dispatch(resetTodosState());
		expect(store.getState().todosReducer.items).toEqual([]);
	});
});
