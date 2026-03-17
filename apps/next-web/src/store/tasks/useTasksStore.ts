import {create} from "zustand";
import {devtools} from "zustand/middleware";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {taskService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPendingImm,
	setFulfilledImm,
	setRejectedImm,
} from "../common/RequestStatusHelpers";
import type {iTasksState} from "./Types";

interface TasksStore extends iTasksState {
	fetchTasks: (projectId: string) => Promise<void>;
	createTask: (
		projectId: string,
		data: Record<string, unknown>
	) => Promise<void>;
	getTask: (taskId: string) => Promise<void>;
	updateTask: (taskId: string, data: Record<string, unknown>) => Promise<void>;
	moveTask: (taskId: string, data: Record<string, unknown>) => Promise<void>;
	reorderTasks: (tasks: Record<string, unknown>[]) => Promise<void>;
	deleteTask: (taskId: string) => Promise<void>;
	resetTasksState: () => void;
	selectTask: (task: Record<string, unknown> | null) => void;
}

const initialState: iTasksState = {
	items: [],
	selectedTask: null,
	fetchStatus: {...initialRequestStatus},
	createStatus: {...initialRequestStatus},
	updateStatus: {...initialRequestStatus},
	deleteStatus: {...initialRequestStatus},
	moveStatus: {...initialRequestStatus},
	reorderStatus: {...initialRequestStatus},
	getTaskStatus: {...initialRequestStatus},
};

export const useTasksStore = create<TasksStore>()(
	devtools(
		(set, get) => ({
			...initialState,

			fetchTasks: async (projectId) => {
				set({fetchStatus: setPendingImm()});
				const result = await taskService.getTasks(projectId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						items: (result.data as unknown as Record<string, unknown>[]) ?? [],
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

			createTask: async (projectId, data) => {
				set({createStatus: setPendingImm()});
				const result = await taskService.createTask(projectId, data);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_CREATED
				) {
					const newTask = result.data as unknown as Record<string, unknown>;
					set({
						createStatus: setFulfilledImm(httpStatusCodes.SUCCESS_CREATED),
						items: newTask ? [...get().items, newTask] : get().items,
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

			getTask: async (taskId) => {
				set({getTaskStatus: setPendingImm()});
				const result = await taskService.getTask(taskId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						getTaskStatus: setFulfilledImm(),
						selectedTask:
							(result.data as unknown as Record<string, unknown>) ?? null,
					});
				} else {
					set({
						getTaskStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			updateTask: async (taskId, data) => {
				set({updateStatus: setPendingImm()});
				const result = await taskService.updateTask(taskId, data);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					const updated = result.data as unknown as Record<string, unknown>;
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

			moveTask: async (taskId, data) => {
				set({moveStatus: setPendingImm()});
				const result = await taskService.moveTask(taskId, data);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({moveStatus: setFulfilledImm()});
				} else {
					set({
						moveStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			reorderTasks: async (tasks) => {
				set({reorderStatus: setPendingImm()});
				const result = await taskService.reorderTasks(tasks);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({reorderStatus: setFulfilledImm()});
				} else {
					set({
						reorderStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			deleteTask: async (taskId) => {
				set({deleteStatus: setPendingImm()});
				const result = await taskService.deleteTask(taskId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_NO_CONTENT
				) {
					set({
						deleteStatus: setFulfilledImm(httpStatusCodes.SUCCESS_NO_CONTENT),
						items: get().items.filter((item) => item.id !== taskId),
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

			resetTasksState: () => set({...initialState}),
			selectTask: (task) => set({selectedTask: task}),
		}),
		{name: "tasksStore"}
	)
);
