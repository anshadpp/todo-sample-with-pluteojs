import AsyncStorage from "@react-native-async-storage/async-storage";
import {apiFetch} from "./api";
import {
	getCachedTasks,
	setCachedTasks,
	getCachedProjects,
	setCachedProjects,
	type LocalTask,
	type LocalProject,
} from "./storage";

// ─── Sync Queue ─────────────────────────────────────────────────────────────
// Every offline mutation (create, update, delete) is added to a queue.
// When the device comes back online and user is signed in, the queue is replayed.

export type SyncAction =
	| {type: "create_project"; localId: string; payload: Record<string, unknown>}
	| {type: "delete_project"; projectId: string; isLocal?: boolean}
	| {
			type: "create_task";
			projectId: string;
			categoryId: string;
			localId: string;
			payload: Record<string, unknown>;
	  }
	| {
			type: "update_task";
			taskId: string;
			projectId: string;
			payload: Record<string, unknown>;
	  }
	| {type: "delete_task"; taskId: string; projectId: string};

const QUEUE_KEY = "@pluteo/sync_queue";

export async function getSyncQueue(): Promise<SyncAction[]> {
	const raw = await AsyncStorage.getItem(QUEUE_KEY);
	return raw ? JSON.parse(raw) : [];
}

export async function addToSyncQueue(action: SyncAction): Promise<void> {
	const queue = await getSyncQueue();
	queue.push(action);
	await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function clearSyncQueue(): Promise<void> {
	await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
}

// ─── Sync Engine ────────────────────────────────────────────────────────────

export interface SyncResult {
	synced: number;
	failed: number;
	errors: string[];
}

export async function processSyncQueue(): Promise<SyncResult> {
	const queue = await getSyncQueue();
	if (queue.length === 0) return {synced: 0, failed: 0, errors: []};

	// Check if user is signed in (has auth cookie)
	const cookie = await AsyncStorage.getItem("@pluteo/cookie");
	if (!cookie) {
		return {
			synced: 0,
			failed: 0,
			errors: ["Sign in to sync your offline changes to the cloud"],
		};
	}

	const result: SyncResult = {synced: 0, failed: 0, errors: []};
	const remaining: SyncAction[] = [];

	// Track local→server project ID mapping for tasks that reference local project IDs
	const projectIdMap: Record<string, string> = {};

	for (const action of queue) {
		try {
			const success = await processAction(action, projectIdMap);
			if (success) {
				result.synced++;
			} else {
				result.failed++;
				remaining.push(action);
			}
		} catch (err) {
			result.failed++;
			result.errors.push(`${action.type}: ${err}`);
			remaining.push(action);
		}
	}

	// Save remaining failed actions back to queue
	await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
	return result;
}

async function processAction(
	action: SyncAction,
	projectIdMap: Record<string, string>
): Promise<boolean> {
	switch (action.type) {
		case "create_project": {
			// Need an org ID — fetch orgs from server
			const orgsRes = await apiFetch<{id: string}[]>(
				"/api/v1/auth/organization/list"
			);
			if (!orgsRes.data || orgsRes.data.length === 0) return false;

			const orgId = orgsRes.data[0].id;
			await apiFetch("/api/v1/auth/organization/set-active", {
				method: "POST",
				body: JSON.stringify({organizationId: orgId}),
			});

			const res = await apiFetch<{id: string; name: string}>(
				"/api/v1/projects/",
				{
					method: "POST",
					body: JSON.stringify({...action.payload, organizationId: orgId}),
				}
			);
			if (res.isSuccess && res.data) {
				const serverId = res.data.id;
				projectIdMap[action.localId] = serverId;

				// Update local project cache: replace local ID with server ID
				const projects = await getCachedProjects();
				const updated = projects.map((p) =>
					p.id === action.localId
						? {...p, id: serverId, organizationId: orgId, isLocal: false}
						: p
				);
				await setCachedProjects(updated);

				// Migrate tasks from local project ID to server project ID
				const tasks = await getCachedTasks(action.localId);
				if (tasks.length > 0) {
					const migratedTasks = tasks.map((t) => ({...t, projectId: serverId}));
					await setCachedTasks(serverId, migratedTasks);
				}
				await AsyncStorage.removeItem(`@pluteo/tasks/${action.localId}`);

				return true;
			}
			return false;
		}
		case "delete_project": {
			if (action.isLocal) return true; // Local-only, no server call needed
			const res = await apiFetch(`/api/v1/projects/${action.projectId}`, {
				method: "DELETE",
			});
			return res.isSuccess;
		}
		case "create_task": {
			// Resolve project ID if it was mapped from a local project
			const resolvedProjectId =
				projectIdMap[action.projectId] || action.projectId;

			const res = await apiFetch(
				`/api/v1/projects/${resolvedProjectId}/tasks/`,
				{
					method: "POST",
					body: JSON.stringify(action.payload),
				}
			);
			if (res.isSuccess && res.data) {
				// Replace local task with server version
				const tasks = await getCachedTasks(resolvedProjectId);
				const serverTask = res.data as LocalTask;
				const updated = tasks.map((t) =>
					t.id === action.localId ? {...serverTask, isLocal: false} : t
				);
				await setCachedTasks(resolvedProjectId, updated);
				return true;
			}
			return false;
		}
		case "update_task": {
			const resolvedProjectId =
				projectIdMap[action.projectId] || action.projectId;
			const res = await apiFetch(`/api/v1/tasks/${action.taskId}`, {
				method: "PATCH",
				body: JSON.stringify(action.payload),
			});
			if (res.isSuccess && res.data) {
				const tasks = await getCachedTasks(resolvedProjectId);
				const serverTask = res.data as LocalTask;
				const updated = tasks.map((t) =>
					t.id === action.taskId ? {...serverTask, isLocal: false} : t
				);
				await setCachedTasks(resolvedProjectId, updated);
				return true;
			}
			return false;
		}
		case "delete_task": {
			const res = await apiFetch(`/api/v1/tasks/${action.taskId}`, {
				method: "DELETE",
			});
			return res.isSuccess;
		}
	}
}

// ─── Pending count ──────────────────────────────────────────────────────────

export async function getPendingSyncCount(): Promise<number> {
	const queue = await getSyncQueue();
	return queue.length;
}
