import {describe, it, expect, vi, beforeEach} from "vitest";

import {
	createTestStore,
	mockSuccessResponse,
	mockErrorResponse,
	expectIdle,
	expectLoading,
	expectSuccess,
	expectError,
	TestStore,
} from "./testHelpers";
import {
	fetchProjects,
	createProject,
	getProject,
	updateProject,
	deleteProject,
	resetProjectsState,
	clearSelectedProject,
	clearCreateStatus,
} from "@/store/projects/ProjectsSlice";

vi.mock("@/services/api/PluteoJS", () => ({
	projectService: {
		getProjects: vi.fn(),
		createProject: vi.fn(),
		getProject: vi.fn(),
		updateProject: vi.fn(),
		deleteProject: vi.fn(),
	},
}));

import {projectService} from "@/services/api/PluteoJS";

const mockProject = {id: "p-1", name: "Project 1", description: "Desc"};
const mockProject2 = {id: "p-2", name: "Project 2", description: "Desc 2"};

describe("ProjectsSlice", () => {
	let store: TestStore;

	beforeEach(() => {
		store = createTestStore();
		vi.clearAllMocks();
	});

	describe("initial state", () => {
		it("should have correct initial state", () => {
			const state = store.getState().projectsReducer;
			expect(state.items).toEqual([]);
			expect(state.selectedProject).toBeNull();
			expectIdle(state.fetchStatus);
		});
	});

	describe("fetchProjects", () => {
		it("should fetch projects successfully", async () => {
			vi.mocked(projectService.getProjects).mockResolvedValue(
				mockSuccessResponse([mockProject, mockProject2])
			);

			await store.dispatch(fetchProjects("org-1"));

			const state = store.getState().projectsReducer;
			expectSuccess(state.fetchStatus);
			expect(state.items).toEqual([mockProject, mockProject2]);
		});

		it("should handle pending", () => {
			vi.mocked(projectService.getProjects).mockReturnValue(
				new Promise(() => {})
			);
			store.dispatch(fetchProjects("org-1"));
			expectLoading(store.getState().projectsReducer.fetchStatus);
		});

		it("should handle error", async () => {
			vi.mocked(projectService.getProjects).mockResolvedValue(
				mockErrorResponse("Failed", 500)
			);
			await store.dispatch(fetchProjects("org-1"));
			expectError(store.getState().projectsReducer.fetchStatus);
		});
	});

	describe("createProject", () => {
		it("should create and append project", async () => {
			vi.mocked(projectService.createProject).mockResolvedValue(
				mockSuccessResponse(mockProject, 201)
			);

			await store.dispatch(
				createProject({orgId: "org-1", data: {name: "New"}})
			);

			const state = store.getState().projectsReducer;
			expectSuccess(state.createStatus);
			expect(state.items).toHaveLength(1);
		});
	});

	describe("getProject", () => {
		it("should set selectedProject", async () => {
			vi.mocked(projectService.getProject).mockResolvedValue(
				mockSuccessResponse(mockProject)
			);

			await store.dispatch(getProject({orgId: "org-1", id: "p-1"}));

			const state = store.getState().projectsReducer;
			expectSuccess(state.getProjectStatus);
			expect(state.selectedProject).toEqual(mockProject);
		});
	});

	describe("updateProject", () => {
		it("should update project in list and selectedProject", async () => {
			// Setup: populate items and select one
			vi.mocked(projectService.getProjects).mockResolvedValue(
				mockSuccessResponse([mockProject])
			);
			await store.dispatch(fetchProjects("org-1"));
			vi.mocked(projectService.getProject).mockResolvedValue(
				mockSuccessResponse(mockProject)
			);
			await store.dispatch(getProject({orgId: "org-1", id: "p-1"}));

			// Update
			const updated = {...mockProject, name: "Updated"};
			vi.mocked(projectService.updateProject).mockResolvedValue(
				mockSuccessResponse(updated)
			);
			await store.dispatch(
				updateProject({orgId: "org-1", id: "p-1", data: {name: "Updated"}})
			);

			const state = store.getState().projectsReducer;
			expectSuccess(state.updateStatus);
			expect(state.items[0].name).toBe("Updated");
			expect(state.selectedProject?.name).toBe("Updated");
		});
	});

	describe("deleteProject", () => {
		it("should remove project from list", async () => {
			vi.mocked(projectService.getProjects).mockResolvedValue(
				mockSuccessResponse([mockProject, mockProject2])
			);
			await store.dispatch(fetchProjects("org-1"));

			vi.mocked(projectService.deleteProject).mockResolvedValue({
				error: null,
				httpStatusCode: 204,
				message: null,
				data: null,
			});
			await store.dispatch(deleteProject({orgId: "org-1", id: "p-1"}));

			const state = store.getState().projectsReducer;
			expectSuccess(state.deleteStatus);
			expect(state.items).toHaveLength(1);
			expect(state.items[0].id).toBe("p-2");
		});

		it("should clear selectedProject if it was deleted", async () => {
			vi.mocked(projectService.getProject).mockResolvedValue(
				mockSuccessResponse(mockProject)
			);
			await store.dispatch(getProject({orgId: "org-1", id: "p-1"}));

			vi.mocked(projectService.deleteProject).mockResolvedValue({
				error: null,
				httpStatusCode: 204,
				message: null,
				data: null,
			});
			await store.dispatch(deleteProject({orgId: "org-1", id: "p-1"}));
			expect(store.getState().projectsReducer.selectedProject).toBeNull();
		});
	});

	describe("sync reducers", () => {
		it("resetProjectsState", async () => {
			vi.mocked(projectService.getProjects).mockResolvedValue(
				mockSuccessResponse([mockProject])
			);
			await store.dispatch(fetchProjects("org-1"));
			store.dispatch(resetProjectsState());
			expect(store.getState().projectsReducer.items).toEqual([]);
		});

		it("clearSelectedProject", async () => {
			vi.mocked(projectService.getProject).mockResolvedValue(
				mockSuccessResponse(mockProject)
			);
			await store.dispatch(getProject({orgId: "o", id: "p-1"}));
			store.dispatch(clearSelectedProject());
			expect(store.getState().projectsReducer.selectedProject).toBeNull();
		});

		it("clearCreateStatus", async () => {
			vi.mocked(projectService.createProject).mockResolvedValue(
				mockErrorResponse("Fail", 400)
			);
			await store.dispatch(createProject({orgId: "o", data: {}}));
			store.dispatch(clearCreateStatus());
			expectIdle(store.getState().projectsReducer.createStatus);
		});
	});
});
