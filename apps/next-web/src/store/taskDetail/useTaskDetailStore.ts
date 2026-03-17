import {create} from "zustand";
import {devtools} from "zustand/middleware";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {
	commentService,
	taskService,
	activityService,
} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPendingImm,
	setFulfilledImm,
	setRejectedImm,
} from "../common/RequestStatusHelpers";
import type {iTaskDetailState} from "./Types";

interface TaskDetailStore extends iTaskDetailState {
	fetchComments: (taskId: string) => Promise<void>;
	createComment: (taskId: string, content: string) => Promise<void>;
	updateComment: (
		taskId: string,
		commentId: string,
		content: string
	) => Promise<void>;
	deleteComment: (taskId: string, commentId: string) => Promise<void>;
	fetchActivities: (taskId: string) => Promise<void>;
	fetchDependencies: (taskId: string) => Promise<void>;
	addDependency: (
		taskId: string,
		dependsOnTaskId: string,
		dependencyType?: string
	) => Promise<void>;
	removeDependency: (taskId: string, dependencyId: string) => Promise<void>;
	resetTaskDetailState: () => void;
}

const initialState: iTaskDetailState = {
	comments: [],
	activities: [],
	dependencies: [],
	fetchCommentsStatus: {...initialRequestStatus},
	createCommentStatus: {...initialRequestStatus},
	updateCommentStatus: {...initialRequestStatus},
	deleteCommentStatus: {...initialRequestStatus},
	fetchActivitiesStatus: {...initialRequestStatus},
	fetchDependenciesStatus: {...initialRequestStatus},
	addDependencyStatus: {...initialRequestStatus},
	removeDependencyStatus: {...initialRequestStatus},
};

export const useTaskDetailStore = create<TaskDetailStore>()(
	devtools(
		(set, get) => ({
			...initialState,

			fetchComments: async (taskId) => {
				set({fetchCommentsStatus: setPendingImm()});
				const result = await commentService.getComments(taskId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						comments: (result.data?.data as Record<string, unknown>[]) ?? [],
						fetchCommentsStatus: setFulfilledImm(),
					});
				} else {
					set({
						fetchCommentsStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			createComment: async (taskId, content) => {
				set({createCommentStatus: setPendingImm()});
				const result = await commentService.createComment(taskId, {content});
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_CREATED
				) {
					const newComment = result.data?.data as Record<string, unknown>;
					set({
						createCommentStatus: setFulfilledImm(
							httpStatusCodes.SUCCESS_CREATED
						),
						comments: newComment
							? [...get().comments, newComment]
							: get().comments,
					});
				} else {
					set({
						createCommentStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			updateComment: async (taskId, commentId, content) => {
				set({updateCommentStatus: setPendingImm()});
				const result = await commentService.updateComment(taskId, commentId, {
					content,
				});
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({updateCommentStatus: setFulfilledImm()});
				} else {
					set({
						updateCommentStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			deleteComment: async (taskId, commentId) => {
				set({deleteCommentStatus: setPendingImm()});
				const result = await commentService.deleteComment(taskId, commentId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_NO_CONTENT
				) {
					set({
						deleteCommentStatus: setFulfilledImm(
							httpStatusCodes.SUCCESS_NO_CONTENT
						),
						comments: get().comments.filter(
							(c) => (c as {id: string}).id !== commentId
						),
					});
				} else {
					set({
						deleteCommentStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			fetchActivities: async (taskId) => {
				set({fetchActivitiesStatus: setPendingImm()});
				const result = await activityService.getActivities(taskId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						activities: (result.data?.data as Record<string, unknown>[]) ?? [],
						fetchActivitiesStatus: setFulfilledImm(),
					});
				} else {
					set({
						fetchActivitiesStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			fetchDependencies: async (taskId) => {
				set({fetchDependenciesStatus: setPendingImm()});
				const result = await taskService.getDependencies(taskId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						dependencies:
							(result.data?.data as unknown as Record<string, unknown>[]) ?? [],
						fetchDependenciesStatus: setFulfilledImm(),
					});
				} else {
					set({
						fetchDependenciesStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			addDependency: async (
				taskId,
				dependsOnTaskId,
				dependencyType = "blocks"
			) => {
				set({addDependencyStatus: setPendingImm()});
				const result = await taskService.addDependency(
					taskId,
					dependsOnTaskId,
					dependencyType
				);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_CREATED
				) {
					const dep = result.data?.data as Record<string, unknown>;
					set({
						addDependencyStatus: setFulfilledImm(
							httpStatusCodes.SUCCESS_CREATED
						),
						dependencies: dep
							? [...get().dependencies, dep]
							: get().dependencies,
					});
				} else {
					set({
						addDependencyStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			removeDependency: async (taskId, dependencyId) => {
				set({removeDependencyStatus: setPendingImm()});
				const result = await taskService.removeDependency(taskId, dependencyId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_NO_CONTENT
				) {
					set({
						removeDependencyStatus: setFulfilledImm(
							httpStatusCodes.SUCCESS_NO_CONTENT
						),
						dependencies: get().dependencies.filter(
							(d) => (d as {id: string}).id !== dependencyId
						),
					});
				} else {
					set({
						removeDependencyStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			resetTaskDetailState: () => set({...initialState}),
		}),
		{name: "taskDetailStore"}
	)
);
