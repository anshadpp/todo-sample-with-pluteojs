import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {boardService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPending,
	setFulfilled,
	setRejected,
} from "../common/RequestStatusHelpers";
import {iBoardsState, REDUCER_NAME} from "./Types";

// Thunks

export const fetchBoards = createAsyncThunk(
	"boards/fetchBoards",
	async (projectId: string, {rejectWithValue}) => {
		const result = await boardService.getBoards(projectId);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const createBoard = createAsyncThunk(
	"boards/createBoard",
	async (
		{projectId, data}: {projectId: string; data: Record<string, unknown>},
		{rejectWithValue}
	) => {
		const result = await boardService.createBoard(projectId, data);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_CREATED
		) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const getBoard = createAsyncThunk(
	"boards/getBoard",
	async (boardId: string, {rejectWithValue}) => {
		const result = await boardService.getBoard(boardId);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const updateBoard = createAsyncThunk(
	"boards/updateBoard",
	async (
		{boardId, data}: {boardId: string; data: Record<string, unknown>},
		{rejectWithValue}
	) => {
		const result = await boardService.updateBoard(boardId, data);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const deleteBoard = createAsyncThunk(
	"boards/deleteBoard",
	async (boardId: string, {rejectWithValue}) => {
		const result = await boardService.deleteBoard(boardId);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_NO_CONTENT
		) {
			return rejectWithValue(result);
		}
		return {result, boardId};
	}
);

export const fetchCategories = createAsyncThunk(
	"boards/fetchCategories",
	async (boardId: string, {rejectWithValue}) => {
		const result = await boardService.getCategories(boardId);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const createCategory = createAsyncThunk(
	"boards/createCategory",
	async (
		{boardId, data}: {boardId: string; data: Record<string, unknown>},
		{rejectWithValue}
	) => {
		const result = await boardService.createCategory(boardId, data);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_CREATED
		) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const updateCategory = createAsyncThunk(
	"boards/updateCategory",
	async (
		{
			boardId,
			categoryId,
			data,
		}: {boardId: string; categoryId: string; data: Record<string, unknown>},
		{rejectWithValue}
	) => {
		const result = await boardService.updateCategory(boardId, categoryId, data);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const deleteCategory = createAsyncThunk(
	"boards/deleteCategory",
	async (
		{boardId, categoryId}: {boardId: string; categoryId: string},
		{rejectWithValue}
	) => {
		const result = await boardService.deleteCategory(boardId, categoryId);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_NO_CONTENT
		) {
			return rejectWithValue(result);
		}
		return {result, categoryId};
	}
);

export const reorderCategories = createAsyncThunk(
	"boards/reorderCategories",
	async (
		{boardId, items}: {boardId: string; items: Record<string, unknown>[]},
		{rejectWithValue}
	) => {
		const result = await boardService.reorderCategories(boardId, items);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

// Slice

const initialState: iBoardsState = {
	items: [],
	selectedBoard: null,
	categories: [],
	fetchStatus: {...initialRequestStatus},
	createStatus: {...initialRequestStatus},
	updateStatus: {...initialRequestStatus},
	deleteStatus: {...initialRequestStatus},
	fetchCategoriesStatus: {...initialRequestStatus},
	createCategoryStatus: {...initialRequestStatus},
	updateCategoryStatus: {...initialRequestStatus},
	deleteCategoryStatus: {...initialRequestStatus},
	reorderCategoriesStatus: {...initialRequestStatus},
};

export const boardsSlice = createSlice({
	name: REDUCER_NAME,
	initialState,
	reducers: {
		resetBoardsState: () => initialState,
		clearSelectedBoard: (state) => {
			state.selectedBoard = null;
		},
		clearCategories: (state) => {
			state.categories = [];
		},
	},
	extraReducers: (builder) => {
		// fetchBoards
		builder.addCase(fetchBoards.pending, (state) => {
			setPending(state, "fetchStatus");
		});
		builder.addCase(fetchBoards.fulfilled, (state, action) => {
			setFulfilled(state, "fetchStatus");
			state.items =
				(action.payload.data?.data as Record<string, unknown>[]) ?? [];
		});
		builder.addCase(fetchBoards.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"fetchStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// createBoard
		builder.addCase(createBoard.pending, (state) => {
			setPending(state, "createStatus");
		});
		builder.addCase(createBoard.fulfilled, (state, action) => {
			setFulfilled(state, "createStatus", httpStatusCodes.SUCCESS_CREATED);
			const newBoard = action.payload.data?.data as Record<string, unknown>;
			if (newBoard) {
				state.items.push(newBoard);
			}
		});
		builder.addCase(createBoard.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"createStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// getBoard
		builder.addCase(getBoard.fulfilled, (state, action) => {
			state.selectedBoard =
				(action.payload.data?.data as Record<string, unknown>) ?? null;
		});

		// updateBoard
		builder.addCase(updateBoard.pending, (state) => {
			setPending(state, "updateStatus");
		});
		builder.addCase(updateBoard.fulfilled, (state, action) => {
			setFulfilled(state, "updateStatus");
			const updated = action.payload.data?.data as Record<string, unknown>;
			if (updated) {
				const index = state.items.findIndex((item) => item.id === updated.id);
				if (index !== -1) {
					state.items[index] = updated;
				}
			}
		});
		builder.addCase(updateBoard.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"updateStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// deleteBoard
		builder.addCase(deleteBoard.pending, (state) => {
			setPending(state, "deleteStatus");
		});
		builder.addCase(deleteBoard.fulfilled, (state, action) => {
			setFulfilled(state, "deleteStatus", httpStatusCodes.SUCCESS_NO_CONTENT);
			state.items = state.items.filter(
				(item) => item.id !== action.payload.boardId
			);
		});
		builder.addCase(deleteBoard.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"deleteStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// fetchCategories
		builder.addCase(fetchCategories.pending, (state) => {
			setPending(state, "fetchCategoriesStatus");
		});
		builder.addCase(fetchCategories.fulfilled, (state, action) => {
			setFulfilled(state, "fetchCategoriesStatus");
			state.categories =
				(action.payload.data?.data as Record<string, unknown>[]) ?? [];
		});
		builder.addCase(fetchCategories.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"fetchCategoriesStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// createCategory
		builder.addCase(createCategory.pending, (state) => {
			setPending(state, "createCategoryStatus");
		});
		builder.addCase(createCategory.fulfilled, (state, action) => {
			setFulfilled(
				state,
				"createCategoryStatus",
				httpStatusCodes.SUCCESS_CREATED
			);
			const newCat = action.payload.data?.data as Record<string, unknown>;
			if (newCat) {
				state.categories.push(newCat);
			}
		});
		builder.addCase(createCategory.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"createCategoryStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// updateCategory
		builder.addCase(updateCategory.pending, (state) => {
			setPending(state, "updateCategoryStatus");
		});
		builder.addCase(updateCategory.fulfilled, (state, action) => {
			setFulfilled(state, "updateCategoryStatus");
			const updated = action.payload.data?.data as Record<string, unknown>;
			if (updated) {
				const index = state.categories.findIndex(
					(cat) => cat.id === updated.id
				);
				if (index !== -1) {
					state.categories[index] = updated;
				}
			}
		});
		builder.addCase(updateCategory.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"updateCategoryStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// deleteCategory
		builder.addCase(deleteCategory.pending, (state) => {
			setPending(state, "deleteCategoryStatus");
		});
		builder.addCase(deleteCategory.fulfilled, (state, action) => {
			setFulfilled(
				state,
				"deleteCategoryStatus",
				httpStatusCodes.SUCCESS_NO_CONTENT
			);
			state.categories = state.categories.filter(
				(cat) => cat.id !== action.payload.categoryId
			);
		});
		builder.addCase(deleteCategory.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"deleteCategoryStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// reorderCategories
		builder.addCase(reorderCategories.pending, (state) => {
			setPending(state, "reorderCategoriesStatus");
		});
		builder.addCase(reorderCategories.fulfilled, (state) => {
			setFulfilled(state, "reorderCategoriesStatus");
		});
		builder.addCase(reorderCategories.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"reorderCategoriesStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});
	},
});

export const {resetBoardsState, clearSelectedBoard, clearCategories} =
	boardsSlice.actions;

export default boardsSlice.reducer;
