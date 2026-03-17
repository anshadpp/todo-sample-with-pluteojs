import {describe, it, expect, vi, beforeEach} from "vitest";

import {
	createTestStore,
	mockSuccessResponse,
	mockErrorResponse,
	expectSuccess,
	TestStore,
} from "./testHelpers";
import {
	fetchComments,
	createComment,
	updateComment,
	deleteComment,
	fetchActivities,
	getDependencies,
	addDependency,
	removeDependency,
	resetTaskDetailState,
	clearComments,
	clearActivities,
} from "@/store/taskDetail/TaskDetailSlice";

vi.mock("@/services/api/PluteoJS", () => ({
	commentService: {
		getComments: vi.fn(),
		createComment: vi.fn(),
		updateComment: vi.fn(),
		deleteComment: vi.fn(),
	},
	activityService: {
		getActivities: vi.fn(),
	},
	taskService: {
		getDependencies: vi.fn(),
		addDependency: vi.fn(),
		removeDependency: vi.fn(),
	},
}));

import {
	commentService,
	activityService,
	taskService,
} from "@/services/api/PluteoJS";

const mockComment = {id: "cm-1", content: "Hello"};
const mockComment2 = {id: "cm-2", content: "World"};
const mockActivity = {id: "a-1", action: "created"};
const mockDeps = {blockedBy: [], blocking: []};

describe("TaskDetailSlice", () => {
	let store: TestStore;

	beforeEach(() => {
		store = createTestStore();
		vi.clearAllMocks();
	});

	describe("comments", () => {
		it("should fetch comments", async () => {
			vi.mocked(commentService.getComments).mockResolvedValue(
				mockSuccessResponse([mockComment, mockComment2])
			);
			await store.dispatch(fetchComments("t-1"));

			const state = store.getState().taskDetailReducer;
			expectSuccess(state.fetchCommentsStatus);
			expect(state.comments).toEqual([mockComment, mockComment2]);
		});

		it("should create and append comment", async () => {
			vi.mocked(commentService.createComment).mockResolvedValue(
				mockSuccessResponse(mockComment, 201)
			);
			await store.dispatch(
				createComment({taskId: "t-1", data: {content: "Hello"}})
			);
			expect(store.getState().taskDetailReducer.comments).toHaveLength(1);
		});

		it("should update comment", async () => {
			vi.mocked(commentService.getComments).mockResolvedValue(
				mockSuccessResponse([mockComment])
			);
			await store.dispatch(fetchComments("t-1"));

			const updated = {...mockComment, content: "Updated"};
			vi.mocked(commentService.updateComment).mockResolvedValue(
				mockSuccessResponse(updated)
			);
			await store.dispatch(
				updateComment({
					taskId: "t-1",
					commentId: "cm-1",
					data: {content: "Updated"},
				})
			);

			expect(store.getState().taskDetailReducer.comments[0].content).toBe(
				"Updated"
			);
		});

		it("should delete comment", async () => {
			vi.mocked(commentService.getComments).mockResolvedValue(
				mockSuccessResponse([mockComment, mockComment2])
			);
			await store.dispatch(fetchComments("t-1"));

			vi.mocked(commentService.deleteComment).mockResolvedValue({
				error: null,
				httpStatusCode: 204,
				message: null,
				data: null,
			});
			await store.dispatch(deleteComment({taskId: "t-1", commentId: "cm-1"}));

			expect(store.getState().taskDetailReducer.comments).toHaveLength(1);
			expect(store.getState().taskDetailReducer.comments[0].id).toBe("cm-2");
		});
	});

	describe("activities", () => {
		it("should fetch activities", async () => {
			vi.mocked(activityService.getActivities).mockResolvedValue(
				mockSuccessResponse([mockActivity])
			);
			await store.dispatch(fetchActivities("t-1"));

			const state = store.getState().taskDetailReducer;
			expectSuccess(state.fetchActivitiesStatus);
			expect(state.activities).toEqual([mockActivity]);
		});
	});

	describe("dependencies", () => {
		it("should get dependencies", async () => {
			vi.mocked(taskService.getDependencies).mockResolvedValue(
				mockSuccessResponse(mockDeps)
			);
			await store.dispatch(getDependencies("t-1"));

			const state = store.getState().taskDetailReducer;
			expectSuccess(state.fetchDependenciesStatus);
			expect(state.dependencies).toEqual(mockDeps);
		});

		it("should add dependency", async () => {
			vi.mocked(taskService.addDependency).mockResolvedValue(
				mockSuccessResponse({}, 201)
			);
			await store.dispatch(
				addDependency({taskId: "t-1", dependsOnTaskId: "t-2"})
			);
			expectSuccess(store.getState().taskDetailReducer.addDependencyStatus);
		});

		it("should remove dependency", async () => {
			vi.mocked(taskService.removeDependency).mockResolvedValue({
				error: null,
				httpStatusCode: 204,
				message: null,
				data: null,
			});
			await store.dispatch(
				removeDependency({taskId: "t-1", dependencyId: "d-1"})
			);
			expectSuccess(store.getState().taskDetailReducer.removeDependencyStatus);
		});
	});

	describe("sync reducers", () => {
		it("resetTaskDetailState", () => {
			store.dispatch(resetTaskDetailState());
			const state = store.getState().taskDetailReducer;
			expect(state.comments).toEqual([]);
			expect(state.activities).toEqual([]);
			expect(state.dependencies).toBeNull();
		});

		it("clearComments", async () => {
			vi.mocked(commentService.getComments).mockResolvedValue(
				mockSuccessResponse([mockComment])
			);
			await store.dispatch(fetchComments("t-1"));
			store.dispatch(clearComments());
			expect(store.getState().taskDetailReducer.comments).toEqual([]);
		});

		it("clearActivities", async () => {
			vi.mocked(activityService.getActivities).mockResolvedValue(
				mockSuccessResponse([mockActivity])
			);
			await store.dispatch(fetchActivities("t-1"));
			store.dispatch(clearActivities());
			expect(store.getState().taskDetailReducer.activities).toEqual([]);
		});
	});
});
