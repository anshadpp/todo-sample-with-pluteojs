import {create} from "zustand";
import {devtools} from "zustand/middleware";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {boardService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPendingImm,
	setFulfilledImm,
	setRejectedImm,
} from "../common/RequestStatusHelpers";
import type {iBoardsState} from "./Types";

interface BoardsStore extends iBoardsState {
	fetchBoards: (projectId: string) => Promise<void>;
	createBoard: (
		projectId: string,
		data: Record<string, unknown>
	) => Promise<void>;
	getBoard: (boardId: string) => Promise<void>;
	updateBoard: (
		boardId: string,
		data: Record<string, unknown>
	) => Promise<void>;
	deleteBoard: (boardId: string) => Promise<void>;
	fetchCategories: (boardId: string) => Promise<void>;
	createCategory: (
		boardId: string,
		data: Record<string, unknown>
	) => Promise<void>;
	updateCategory: (
		boardId: string,
		categoryId: string,
		data: Record<string, unknown>
	) => Promise<void>;
	deleteCategory: (boardId: string, categoryId: string) => Promise<void>;
	reorderCategories: (
		boardId: string,
		items: Record<string, unknown>[]
	) => Promise<void>;
	resetBoardsState: () => void;
	selectBoard: (board: Record<string, unknown> | null) => void;
}

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

export const useBoardsStore = create<BoardsStore>()(
	devtools(
		(set, get) => ({
			...initialState,

			fetchBoards: async (projectId) => {
				set({fetchStatus: setPendingImm()});
				const result = await boardService.getBoards(projectId);
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

			createBoard: async (projectId, data) => {
				set({createStatus: setPendingImm()});
				const result = await boardService.createBoard(projectId, data);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_CREATED
				) {
					const newBoard = result.data as unknown as Record<string, unknown>;
					set({
						createStatus: setFulfilledImm(httpStatusCodes.SUCCESS_CREATED),
						items: newBoard ? [...get().items, newBoard] : get().items,
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

			getBoard: async (boardId) => {
				const result = await boardService.getBoard(boardId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						selectedBoard:
							(result.data as unknown as Record<string, unknown>) ?? null,
					});
				}
			},

			updateBoard: async (boardId, data) => {
				set({updateStatus: setPendingImm()});
				const result = await boardService.updateBoard(boardId, data);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({updateStatus: setFulfilledImm()});
				} else {
					set({
						updateStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			deleteBoard: async (boardId) => {
				set({deleteStatus: setPendingImm()});
				const result = await boardService.deleteBoard(boardId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_NO_CONTENT
				) {
					set({
						deleteStatus: setFulfilledImm(httpStatusCodes.SUCCESS_NO_CONTENT),
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

			fetchCategories: async (boardId) => {
				set({fetchCategoriesStatus: setPendingImm()});
				const result = await boardService.getCategories(boardId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						categories:
							(result.data as unknown as Record<string, unknown>[]) ?? [],
						fetchCategoriesStatus: setFulfilledImm(),
					});
				} else {
					set({
						fetchCategoriesStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			createCategory: async (boardId, data) => {
				set({createCategoryStatus: setPendingImm()});
				const result = await boardService.createCategory(boardId, data);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_CREATED
				) {
					const newCat = result.data as unknown as Record<string, unknown>;
					set({
						createCategoryStatus: setFulfilledImm(
							httpStatusCodes.SUCCESS_CREATED
						),
						categories: newCat
							? [...get().categories, newCat]
							: get().categories,
					});
				} else {
					set({
						createCategoryStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			updateCategory: async (boardId, categoryId, data) => {
				set({updateCategoryStatus: setPendingImm()});
				const result = await boardService.updateCategory(
					boardId,
					categoryId,
					data
				);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({updateCategoryStatus: setFulfilledImm()});
				} else {
					set({
						updateCategoryStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			deleteCategory: async (boardId, categoryId) => {
				set({deleteCategoryStatus: setPendingImm()});
				const result = await boardService.deleteCategory(boardId, categoryId);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_NO_CONTENT
				) {
					set({
						deleteCategoryStatus: setFulfilledImm(
							httpStatusCodes.SUCCESS_NO_CONTENT
						),
					});
				} else {
					set({
						deleteCategoryStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			reorderCategories: async (boardId, items) => {
				set({reorderCategoriesStatus: setPendingImm()});
				const result = await boardService.reorderCategories(boardId, items);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({reorderCategoriesStatus: setFulfilledImm()});
				} else {
					set({
						reorderCategoriesStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			resetBoardsState: () => set({...initialState}),
			selectBoard: (board) => set({selectedBoard: board}),
		}),
		{name: "boardsStore"}
	)
);
