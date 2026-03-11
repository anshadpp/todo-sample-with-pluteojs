import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Local task cache ───────────────────────────────────────────────────────

export interface LocalTask {
	id: string;
	projectId: string;
	categoryId: string | null;
	assigneeId: string | null;
	title: string;
	description: string | null;
	priority: string;
	status: string;
	sortOrder: number;
	dueAt: string | null;
	startAt: string | null;
	estimatedMinutes: number | null;
	effortLevel: string | null;
	createdAt: string;
	updatedAt: string;
	isLocal?: boolean; // true = created offline, not yet synced
}

const TASKS_KEY = "@pluteo/tasks";
const PROJECTS_KEY = "@pluteo/projects";

export async function getCachedTasks(projectId: string): Promise<LocalTask[]> {
	const raw = await AsyncStorage.getItem(`${TASKS_KEY}/${projectId}`);
	return raw ? JSON.parse(raw) : [];
}

export async function setCachedTasks(
	projectId: string,
	tasks: LocalTask[]
): Promise<void> {
	await AsyncStorage.setItem(
		`${TASKS_KEY}/${projectId}`,
		JSON.stringify(tasks)
	);
}

export async function addLocalTask(
	projectId: string,
	task: LocalTask
): Promise<void> {
	const tasks = await getCachedTasks(projectId);
	tasks.push(task);
	await setCachedTasks(projectId, tasks);
}

export async function updateLocalTask(
	projectId: string,
	taskId: string,
	updates: Partial<LocalTask>
): Promise<void> {
	const tasks = await getCachedTasks(projectId);
	const idx = tasks.findIndex((t) => t.id === taskId);
	if (idx !== -1) {
		tasks[idx] = {
			...tasks[idx],
			...updates,
			updatedAt: new Date().toISOString(),
		};
		await setCachedTasks(projectId, tasks);
	}
}

export async function removeLocalTask(
	projectId: string,
	taskId: string
): Promise<void> {
	const tasks = await getCachedTasks(projectId);
	await setCachedTasks(
		projectId,
		tasks.filter((t) => t.id !== taskId)
	);
}

// ─── Project cache ──────────────────────────────────────────────────────────

export interface LocalProject {
	id: string;
	name: string;
	organizationId: string;
	isLocal?: boolean; // true = created offline
}

export async function getCachedProjects(): Promise<LocalProject[]> {
	const raw = await AsyncStorage.getItem(PROJECTS_KEY);
	return raw ? JSON.parse(raw) : [];
}

export async function setCachedProjects(
	projects: LocalProject[]
): Promise<void> {
	await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export async function addLocalProject(project: LocalProject): Promise<void> {
	const projects = await getCachedProjects();
	projects.push(project);
	await setCachedProjects(projects);
}

export async function updateLocalProject(
	projectId: string,
	updates: Partial<LocalProject>
): Promise<void> {
	const projects = await getCachedProjects();
	const idx = projects.findIndex((p) => p.id === projectId);
	if (idx !== -1) {
		projects[idx] = {...projects[idx], ...updates};
		await setCachedProjects(projects);
	}
}

export async function removeLocalProject(projectId: string): Promise<void> {
	const projects = await getCachedProjects();
	await setCachedProjects(projects.filter((p) => p.id !== projectId));
	// Also remove cached tasks for this project
	await AsyncStorage.removeItem(`${TASKS_KEY}/${projectId}`);
}
