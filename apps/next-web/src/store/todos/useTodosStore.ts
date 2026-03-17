import {create} from "zustand";
import {devtools} from "zustand/middleware";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {todoService} from "@/services/api/PluteoJS";
import type {
	Todo,
	CreateTodoInput,
	UpdateTodoInput,
} from "@/services/api/PluteoJS/TodoService";

import {
	initialRequestStatus,
	setPendingImm,
	setFulfilledImm,
	setRejectedImm,
} from "../common/RequestStatusHelpers";
import type {iTodosState} from "./Types";

interface TodosStore extends iTodosState {
	fetchTodos: () => Promise<void>;
	createTodo: (input: CreateTodoInput) => Promise<void>;
	updateTodo: (todoId: string, input: UpdateTodoInput) => Promise<void>;
	deleteTodo: (todoId: string) => Promise<void>;
	resetTodosState: () => void;
	clearCreateStatus: () => void;
}

const initialState: iTodosState = {
	items: [],
	fetchStatus: {...initialRequestStatus},
	createStatus: {...initialRequestStatus},
	updateStatus: {...initialRequestStatus},
	deleteStatus: {...initialRequestStatus},
};

export const useTodosStore = create<TodosStore>()(
	devtools(
		(set, get) => ({
			...initialState,

			fetchTodos: async () => {
				set({fetchStatus: setPendingImm()});
				const result = await todoService.getTodos();
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						items: (result.data?.data as Todo[]) ?? [],
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

			createTodo: async (input: CreateTodoInput) => {
				set({createStatus: setPendingImm()});
				const result = await todoService.createTodo(input);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_CREATED
				) {
					const newTodo = result.data?.data as Todo;
					set({
						createStatus: setFulfilledImm(httpStatusCodes.SUCCESS_CREATED),
						items: newTodo ? [...get().items, newTodo] : get().items,
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

			updateTodo: async (todoId: string, input: UpdateTodoInput) => {
				set({updateStatus: setPendingImm()});
				const result = await todoService.updateTodo(todoId, input);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					const updated = result.data?.data as Todo;
					set({
						updateStatus: setFulfilledImm(),
						items: updated
							? get().items.map((item) =>
									item.id === updated.id ? updated : item
								)
							: get().items,
					});
				} else {
					set({
						updateStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			deleteTodo: async (todoId: string) => {
				set({deleteStatus: setPendingImm()});
				const result = await todoService.deleteTodo(todoId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_NO_CONTENT
				) {
					set({
						deleteStatus: setFulfilledImm(httpStatusCodes.SUCCESS_NO_CONTENT),
						items: get().items.filter((item) => item.id !== todoId),
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

			resetTodosState: () => set({...initialState}),
			clearCreateStatus: () => set({createStatus: {...initialRequestStatus}}),
		}),
		{name: "todosStore"}
	)
);
