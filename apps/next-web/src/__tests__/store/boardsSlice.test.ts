import {describe, it, expect, vi, beforeEach} from "vitest";

import {
	createTestStore,
	mockSuccessResponse,
	mockErrorResponse,
	expectIdle,
	expectSuccess,
	expectError,
	TestStore,
} from "./testHelpers";
import {
	fetchBoards,
	createBoard,
	getBoard,
	updateBoard,
	deleteBoard,
	fetchCategories,
	createCategory,
	updateCategory,
	deleteCategory,
	reorderCategories,
	resetBoardsState,
	clearSelectedBoard,
	clearCategories,
} from "@/store/boards/BoardsSlice";

vi.mock("@/services/api/PluteoJS", () => ({
	boardService: {
		getBoards: vi.fn(),
		createBoard: vi.fn(),
		getBoard: vi.fn(),
		updateBoard: vi.fn(),
		deleteBoard: vi.fn(),
		getCategories: vi.fn(),
		createCategory: vi.fn(),
		updateCategory: vi.fn(),
		deleteCategory: vi.fn(),
		reorderCategories: vi.fn(),
	},
}));

import {boardService} from "@/services/api/PluteoJS";

const mockBoard = {id: "b-1", name: "Board 1"};
const mockCategory = {id: "c-1", name: "To Do"};
const mockCategory2 = {id: "c-2", name: "In Progress"};

describe("BoardsSlice", () => {
	let store: TestStore;

	beforeEach(() => {
		store = createTestStore();
		vi.clearAllMocks();
	});

	describe("initial state", () => {
		it("should have correct initial state", () => {
			const state = store.getState().boardsReducer;
			expect(state.items).toEqual([]);
			expect(state.selectedBoard).toBeNull();
			expect(state.categories).toEqual([]);
		});
	});

	describe("fetchBoards", () => {
		it("should fetch boards successfully", async () => {
			vi.mocked(boardService.getBoards).mockResolvedValue(
				mockSuccessResponse([mockBoard])
			);
			await store.dispatch(fetchBoards("p-1"));
			const state = store.getState().boardsReducer;
			expectSuccess(state.fetchStatus);
			expect(state.items).toEqual([mockBoard]);
		});

		it("should handle error", async () => {
			vi.mocked(boardService.getBoards).mockResolvedValue(
				mockErrorResponse("Failed")
			);
			await store.dispatch(fetchBoards("p-1"));
			expectError(store.getState().boardsReducer.fetchStatus);
		});
	});

	describe("createBoard", () => {
		it("should create and append board", async () => {
			vi.mocked(boardService.createBoard).mockResolvedValue(
				mockSuccessResponse(mockBoard, 201)
			);
			await store.dispatch(
				createBoard({projectId: "p-1", data: {name: "New"}})
			);
			expect(store.getState().boardsReducer.items).toHaveLength(1);
		});
	});

	describe("getBoard", () => {
		it("should set selectedBoard", async () => {
			vi.mocked(boardService.getBoard).mockResolvedValue(
				mockSuccessResponse(mockBoard)
			);
			await store.dispatch(getBoard("b-1"));
			expect(store.getState().boardsReducer.selectedBoard).toEqual(mockBoard);
		});
	});

	describe("updateBoard", () => {
		it("should update board in list", async () => {
			vi.mocked(boardService.getBoards).mockResolvedValue(
				mockSuccessResponse([mockBoard])
			);
			await store.dispatch(fetchBoards("p-1"));

			const updated = {...mockBoard, name: "Updated"};
			vi.mocked(boardService.updateBoard).mockResolvedValue(
				mockSuccessResponse(updated)
			);
			await store.dispatch(
				updateBoard({boardId: "b-1", data: {name: "Updated"}})
			);

			expect(store.getState().boardsReducer.items[0].name).toBe("Updated");
		});
	});

	describe("deleteBoard", () => {
		it("should remove board from list", async () => {
			vi.mocked(boardService.getBoards).mockResolvedValue(
				mockSuccessResponse([mockBoard])
			);
			await store.dispatch(fetchBoards("p-1"));

			vi.mocked(boardService.deleteBoard).mockResolvedValue({
				error: null,
				httpStatusCode: 204,
				message: null,
				data: null,
			});
			await store.dispatch(deleteBoard("b-1"));

			expect(store.getState().boardsReducer.items).toHaveLength(0);
		});
	});

	describe("categories", () => {
		it("should fetch categories", async () => {
			vi.mocked(boardService.getCategories).mockResolvedValue(
				mockSuccessResponse([mockCategory, mockCategory2])
			);
			await store.dispatch(fetchCategories("b-1"));

			const state = store.getState().boardsReducer;
			expectSuccess(state.fetchCategoriesStatus);
			expect(state.categories).toEqual([mockCategory, mockCategory2]);
		});

		it("should create and append category", async () => {
			vi.mocked(boardService.createCategory).mockResolvedValue(
				mockSuccessResponse(mockCategory, 201)
			);
			await store.dispatch(
				createCategory({boardId: "b-1", data: {name: "New"}})
			);
			expect(store.getState().boardsReducer.categories).toHaveLength(1);
		});

		it("should update category", async () => {
			vi.mocked(boardService.getCategories).mockResolvedValue(
				mockSuccessResponse([mockCategory])
			);
			await store.dispatch(fetchCategories("b-1"));

			const updated = {...mockCategory, name: "Updated"};
			vi.mocked(boardService.updateCategory).mockResolvedValue(
				mockSuccessResponse(updated)
			);
			await store.dispatch(
				updateCategory({
					boardId: "b-1",
					categoryId: "c-1",
					data: {name: "Updated"},
				})
			);

			expect(store.getState().boardsReducer.categories[0].name).toBe("Updated");
		});

		it("should delete category", async () => {
			vi.mocked(boardService.getCategories).mockResolvedValue(
				mockSuccessResponse([mockCategory, mockCategory2])
			);
			await store.dispatch(fetchCategories("b-1"));

			vi.mocked(boardService.deleteCategory).mockResolvedValue({
				error: null,
				httpStatusCode: 204,
				message: null,
				data: null,
			});
			await store.dispatch(deleteCategory({boardId: "b-1", categoryId: "c-1"}));

			expect(store.getState().boardsReducer.categories).toHaveLength(1);
		});

		it("should reorder categories", async () => {
			vi.mocked(boardService.reorderCategories).mockResolvedValue(
				mockSuccessResponse({})
			);
			await store.dispatch(
				reorderCategories({boardId: "b-1", items: [{id: "c-2"}, {id: "c-1"}]})
			);
			expectSuccess(store.getState().boardsReducer.reorderCategoriesStatus);
		});
	});

	describe("sync reducers", () => {
		it("resetBoardsState", () => {
			store.dispatch(resetBoardsState());
			expect(store.getState().boardsReducer.items).toEqual([]);
		});

		it("clearSelectedBoard", async () => {
			vi.mocked(boardService.getBoard).mockResolvedValue(
				mockSuccessResponse(mockBoard)
			);
			await store.dispatch(getBoard("b-1"));
			store.dispatch(clearSelectedBoard());
			expect(store.getState().boardsReducer.selectedBoard).toBeNull();
		});

		it("clearCategories", async () => {
			vi.mocked(boardService.getCategories).mockResolvedValue(
				mockSuccessResponse([mockCategory])
			);
			await store.dispatch(fetchCategories("b-1"));
			store.dispatch(clearCategories());
			expect(store.getState().boardsReducer.categories).toEqual([]);
		});
	});
});
