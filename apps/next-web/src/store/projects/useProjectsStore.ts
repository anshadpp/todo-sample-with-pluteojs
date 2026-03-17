import {create} from "zustand";
import {devtools} from "zustand/middleware";

import {httpStatusCodes} from "@/customTypes/NetworkTypes";
import {projectService} from "@/services/api/PluteoJS";

import {
	initialRequestStatus,
	setPendingImm,
	setFulfilledImm,
	setRejectedImm,
} from "../common/RequestStatusHelpers";
import type {iProjectsState} from "./Types";

interface ProjectsStore extends iProjectsState {
	fetchProjects: (orgId: string | null | undefined) => Promise<void>;
	createProject: (
		orgId: string | null | undefined,
		data: Record<string, unknown>
	) => Promise<void>;
	getProject: (orgId: string | null | undefined, id: string) => Promise<void>;
	updateProject: (
		orgId: string | null | undefined,
		id: string,
		data: Record<string, unknown>
	) => Promise<void>;
	deleteProject: (
		orgId: string | null | undefined,
		id: string
	) => Promise<void>;
	resetProjectsState: () => void;
	clearSelectedProject: () => void;
	clearCreateStatus: () => void;
}

const initialState: iProjectsState = {
	items: [],
	selectedProject: null,
	fetchStatus: {...initialRequestStatus},
	createStatus: {...initialRequestStatus},
	updateStatus: {...initialRequestStatus},
	deleteStatus: {...initialRequestStatus},
	getProjectStatus: {...initialRequestStatus},
};

export const useProjectsStore = create<ProjectsStore>()(
	devtools(
		(set, get) => ({
			...initialState,

			fetchProjects: async (orgId) => {
				set({fetchStatus: setPendingImm()});
				const result = await projectService.getProjects(orgId);
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

			createProject: async (orgId, data) => {
				set({createStatus: setPendingImm()});
				const result = await projectService.createProject(orgId, data);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_CREATED
				) {
					const newProject = result.data as unknown as Record<string, unknown>;
					set({
						createStatus: setFulfilledImm(httpStatusCodes.SUCCESS_CREATED),
						items: newProject ? [...get().items, newProject] : get().items,
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

			getProject: async (orgId, id) => {
				set({getProjectStatus: setPendingImm()});
				const result = await projectService.getProject(orgId, id);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					set({
						getProjectStatus: setFulfilledImm(),
						selectedProject:
							(result.data as unknown as Record<string, unknown>) ?? null,
					});
				} else {
					set({
						getProjectStatus: setRejectedImm(
							result.message as string,
							result.httpStatusCode
						),
					});
				}
			},

			updateProject: async (orgId, id, data) => {
				set({updateStatus: setPendingImm()});
				const result = await projectService.updateProject(orgId, id, data);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_OK
				) {
					const updated = result.data as unknown as Record<string, unknown>;
					const state = get();
					set({
						updateStatus: setFulfilledImm(),
						items: updated
							? state.items.map((item) =>
									item.id === updated.id ? updated : item
								)
							: state.items,
						selectedProject:
							updated && state.selectedProject?.id === updated.id
								? updated
								: state.selectedProject,
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

			deleteProject: async (orgId, id) => {
				set({deleteStatus: setPendingImm()});
				const result = await projectService.deleteProject(orgId, id);
				if (
					!result.error &&
					result.httpStatusCode === httpStatusCodes.SUCCESS_NO_CONTENT
				) {
					const state = get();
					set({
						deleteStatus: setFulfilledImm(httpStatusCodes.SUCCESS_NO_CONTENT),
						items: state.items.filter((item) => item.id !== id),
						selectedProject:
							state.selectedProject?.id === id ? null : state.selectedProject,
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

			resetProjectsState: () => set({...initialState}),
			clearSelectedProject: () => set({selectedProject: null}),
			clearCreateStatus: () => set({createStatus: {...initialRequestStatus}}),
		}),
		{name: "projectsStore"}
	)
);
