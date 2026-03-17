import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {todoService} from "@/services/api/PluteoJS";
import {
	CreateTodoInput,
	Todo,
	UpdateTodoInput,
} from "@/services/api/PluteoJS/TodoService";

import {
	initialRequestStatus,
	setPending,
	setFulfilled,
	setRejected,
} from "../common/RequestStatusHelpers";
import {iTodosState, REDUCER_NAME} from "./Types";

// Thunks

export const fetchTodos = createAsyncThunk(
	"todos/fetchTodos",
	async (_, {rejectWithValue}) => {
		const result = await todoService.getTodos();
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const createTodo = createAsyncThunk(
	"todos/createTodo",
	async (input: CreateTodoInput, {rejectWithValue}) => {
		const result = await todoService.createTodo(input);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_CREATED
		) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const updateTodo = createAsyncThunk(
	"todos/updateTodo",
	async (
		{todoId, input}: {todoId: string; input: UpdateTodoInput},
		{rejectWithValue}
	) => {
		const result = await todoService.updateTodo(todoId, input);
		if (result.error || result.httpStatusCode !== httpStatusCodes.SUCCESS_OK) {
			return rejectWithValue(result);
		}
		return result;
	}
);

export const deleteTodo = createAsyncThunk(
	"todos/deleteTodo",
	async (todoId: string, {rejectWithValue}) => {
		const result = await todoService.deleteTodo(todoId);
		if (
			result.error ||
			result.httpStatusCode !== httpStatusCodes.SUCCESS_NO_CONTENT
		) {
			return rejectWithValue(result);
		}
		return {result, todoId};
	}
);

// Slice

const initialState: iTodosState = {
	items: [],
	fetchStatus: {...initialRequestStatus},
	createStatus: {...initialRequestStatus},
	updateStatus: {...initialRequestStatus},
	deleteStatus: {...initialRequestStatus},
};

export const todosSlice = createSlice({
	name: REDUCER_NAME,
	initialState,
	reducers: {
		resetTodosState: () => initialState,
		clearCreateStatus: (state) => {
			state.createStatus = {...initialRequestStatus};
		},
	},
	extraReducers: (builder) => {
		// fetchTodos
		builder.addCase(fetchTodos.pending, (state) => {
			setPending(state, "fetchStatus");
		});
		builder.addCase(fetchTodos.fulfilled, (state, action) => {
			setFulfilled(state, "fetchStatus");
			state.items = (action.payload.data?.data as Todo[]) ?? [];
		});
		builder.addCase(fetchTodos.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"fetchStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// createTodo
		builder.addCase(createTodo.pending, (state) => {
			setPending(state, "createStatus");
		});
		builder.addCase(createTodo.fulfilled, (state, action) => {
			setFulfilled(state, "createStatus", httpStatusCodes.SUCCESS_CREATED);
			const newTodo = action.payload.data?.data as Todo;
			if (newTodo) {
				state.items.push(newTodo);
			}
		});
		builder.addCase(createTodo.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"createStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// updateTodo
		builder.addCase(updateTodo.pending, (state) => {
			setPending(state, "updateStatus");
		});
		builder.addCase(updateTodo.fulfilled, (state, action) => {
			setFulfilled(state, "updateStatus");
			const updated = action.payload.data?.data as Todo;
			if (updated) {
				const index = state.items.findIndex((item) => item.id === updated.id);
				if (index !== -1) {
					state.items[index] = updated;
				}
			}
		});
		builder.addCase(updateTodo.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"updateStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});

		// deleteTodo
		builder.addCase(deleteTodo.pending, (state) => {
			setPending(state, "deleteStatus");
		});
		builder.addCase(deleteTodo.fulfilled, (state, action) => {
			setFulfilled(state, "deleteStatus", httpStatusCodes.SUCCESS_NO_CONTENT);
			state.items = state.items.filter(
				(item) => item.id !== action.payload.todoId
			);
		});
		builder.addCase(deleteTodo.rejected, (state, action) => {
			const payload = action.payload as Record<string, unknown> | undefined;
			setRejected(
				state,
				"deleteStatus",
				payload?.message as string,
				payload?.httpStatusCode as number
			);
		});
	},
});

export const {resetTodosState, clearCreateStatus} = todosSlice.actions;

export default todosSlice.reducer;
