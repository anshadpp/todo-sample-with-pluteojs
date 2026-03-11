import {AxiosInstance} from "axios";

import NetworkUtil from "@/utils/NetworkUtil";
import {APIResponse} from "@/customTypes/NetworkTypes";

import {apiEndpoints} from "./axiosConfig/AxiosServiceConstants";

export interface Todo {
	id: string;
	userId: string;
	title: string;
	description: string | null;
	completed: boolean;
	dueAt: string | null;
	notifyAt: string | null;
	notified: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreateTodoInput {
	title: string;
	description?: string;
	dueAt?: string;
	notifyAt?: string;
}

export interface UpdateTodoInput {
	title?: string;
	description?: string | null;
	completed?: boolean;
	dueAt?: string | null;
	notifyAt?: string | null;
}

interface EnvelopeResponse<T> {
	isSuccess: boolean;
	data: T;
	error: unknown;
}

function TodoService(apiServer: AxiosInstance) {
	const getTodos = async (): Promise<APIResponse<Todo[]>> => {
		let result = null;

		await apiServer
			.get(apiEndpoints.todos.list(), {withCredentials: true})
			.then(
				(value) => {
					const envelope = value.data as EnvelopeResponse<Todo[]>;
					result = NetworkUtil.buildResult<Todo[]>(
						null,
						value.status,
						null,
						envelope.data as unknown as null
					);
				},
				(reason) => {
					const {response} = reason;
					const {status, data} = response || {};
					result = NetworkUtil.buildResult<null>(
						data?.error || "Failed to fetch todos",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const createTodo = async (
		input: CreateTodoInput
	): Promise<APIResponse<Todo>> => {
		let result = null;

		await apiServer
			.post(apiEndpoints.todos.create(), input, {withCredentials: true})
			.then(
				(value) => {
					const envelope = value.data as EnvelopeResponse<Todo>;
					result = NetworkUtil.buildResult<Todo>(
						null,
						value.status,
						null,
						envelope.data as unknown as null
					);
				},
				(reason) => {
					const {response} = reason;
					const {status, data} = response || {};
					result = NetworkUtil.buildResult<null>(
						data?.error || "Failed to create todo",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const updateTodo = async (
		todoId: string,
		input: UpdateTodoInput
	): Promise<APIResponse<Todo>> => {
		let result = null;

		await apiServer
			.patch(apiEndpoints.todos.update(todoId), input, {
				withCredentials: true,
			})
			.then(
				(value) => {
					const envelope = value.data as EnvelopeResponse<Todo>;
					result = NetworkUtil.buildResult<Todo>(
						null,
						value.status,
						null,
						envelope.data as unknown as null
					);
				},
				(reason) => {
					const {response} = reason;
					const {status, data} = response || {};
					result = NetworkUtil.buildResult<null>(
						data?.error || "Failed to update todo",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	const deleteTodo = async (todoId: string): Promise<APIResponse<null>> => {
		let result = null;

		await apiServer
			.delete(apiEndpoints.todos.delete(todoId), {withCredentials: true})
			.then(
				(value) => {
					result = NetworkUtil.buildResult<null>(
						null,
						value.status,
						null,
						null
					);
				},
				(reason) => {
					const {response} = reason;
					const {status, data} = response || {};
					result = NetworkUtil.buildResult<null>(
						data?.error || "Failed to delete todo",
						status || 500,
						null,
						null
					);
				}
			);

		return result!;
	};

	return {
		getTodos,
		createTodo,
		updateTodo,
		deleteTodo,
	};
}

export default TodoService;
