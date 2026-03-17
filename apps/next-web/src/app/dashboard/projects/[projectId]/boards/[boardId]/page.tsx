"use client";

import {useEffect, useState, useCallback, useRef, useMemo} from "react";
import {useParams, useRouter} from "next/navigation";
import {
	DndContext,
	DragOverlay,
	closestCorners,
	PointerSensor,
	useSensor,
	useSensors,
	type DragStartEvent,
	type DragEndEvent,
	type DragOverEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
	useSortable,
	arrayMove,
} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {motion, AnimatePresence} from "framer-motion";
import {io, type Socket} from "socket.io-client";

import {Button} from "@/components/lib/shadcn/ui/button";
import {Card, CardContent} from "@/components/lib/shadcn/ui/card";
import {Avatar, AvatarFallback} from "@/components/lib/shadcn/ui/avatar";
import {ScrollArea} from "@/components/lib/shadcn/ui/scroll-area";
import {Skeleton} from "@/components/lib/shadcn/ui/skeleton";
import {Badge} from "@/components/lib/shadcn/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "@/components/lib/shadcn/ui/dropdown-menu";
import {Calendar} from "@/components/lib/shadcn/ui/calendar";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@/components/lib/shadcn/ui/popover";
import {format} from "date-fns";

import {
	boardService,
	taskService,
	commentService,
} from "@/services/api/PluteoJS";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Category {
	id: string;
	boardId: string;
	name: string;
	color: string | null;
	statusValue?: string | null;
	sortOrder: number;
	wipLimit?: number | null;
}

interface Label {
	id: string;
	projectId: string;
	name: string;
	color: string;
	createdAt?: string;
}

interface Task {
	id: string;
	projectId: string;
	categoryId: string | null;
	createdById?: string | null;
	assigneeId: string | null;
	title: string;
	description: string | null;
	priority: string;
	status: string;
	sortOrder: number;
	dueAt: string | null;
	startAt?: string | null;
	estimatedMinutes?: number | null;
	effortLevel?: string | null;
	completedAt?: string | null;
	createdAt?: string;
	assignee?: {id: string; name: string; image: string | null} | null;
	createdByUser?: {id: string; name: string; image: string | null} | null;
	labels?: Label[];
}

interface Comment {
	id: string;
	taskId: string;
	userId: string;
	content: string;
	parentId: string | null;
	isEdited: boolean;
	createdAt: string;
	updatedAt: string;
	user?: {id: string; name: string; image: string | null};
}

interface Activity {
	id: string;
	taskId: string;
	userId: string;
	action: string;
	field: string | null;
	oldValue: string | null;
	newValue: string | null;
	metadata: string | null;
	createdAt: string;
	user?: {id: string; name: string; image: string | null};
}

interface TaskContent {
	id: string;
	taskId: string;
	createdById: string;
	type: "code" | "doc" | "link" | "note";
	title: string | null;
	content: string;
	language: string | null;
	url: string | null;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
	user?: {id: string; name: string; image: string | null};
}

interface Member {
	id: string;
	userId: string;
	name: string;
	email: string;
	image: string | null;
	role: string;
}

interface Board {
	id: string;
	name: string;
	projectId: string;
	type?: "status" | "category";
	categories?: Category[];
}

// ---------------------------------------------------------------------------
// Priority colour map
// ---------------------------------------------------------------------------

const priorityColors: Record<string, string> = {
	urgent: "bg-red-500",
	high: "bg-orange-500",
	medium: "bg-yellow-500",
	low: "bg-blue-400",
	none: "bg-gray-400",
};

const priorityLabels: Record<string, string> = {
	urgent: "Urgent",
	high: "High",
	medium: "Medium",
	low: "Low",
	none: "None",
};

const statusLabels: Record<string, string> = {
	todo: "Todo",
	open: "Open",
	in_progress: "In Progress",
	review: "Review",
	done: "Done",
	closed: "Closed",
};

// ---------------------------------------------------------------------------
// API helper (for services that may not exist yet as modules)
// ---------------------------------------------------------------------------

const API_BASE =
	process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3020";

async function apiFetch<T>(
	url: string,
	options?: RequestInit
): Promise<T | null> {
	try {
		const res = await fetch(`${API_BASE}${url}`, {
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				...(options?.headers || {}),
			},
			...options,
		});
		const json = await res.json();
		return json.data ?? null;
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// Main BoardPage
// ---------------------------------------------------------------------------

export default function BoardPage() {
	const params = useParams();
	const router = useRouter();
	const projectId = params.projectId as string;
	const boardId = params.boardId as string;

	const [boardName, setBoardName] = useState("");
	const [boardType, setBoardType] = useState<"status" | "category">("status");
	const [boards, setBoards] = useState<Board[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [tasksByCategory, setTasksByCategory] = useState<
		Record<string, Task[]>
	>({});
	const [loading, setLoading] = useState(true);
	const [activeTask, setActiveTask] = useState<Task | null>(null);
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);
	const [showTaskModal, setShowTaskModal] = useState(false);
	const [members, setMembers] = useState<Member[]>([]);
	const [projectLabels, setProjectLabels] = useState<Label[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterPriority, setFilterPriority] = useState<string>("all");
	const [filterAssignee, setFilterAssignee] = useState<string>("all");
	const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
	const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState<
		string | null
	>(null);
	const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
	const [viewMode, setViewMode] = useState<
		"board" | "list" | "calendar" | "timeline"
	>("board");
	const socketRef = useRef<Socket | null>(null);

	const tasksByCategoryRef = useRef(tasksByCategory);
	tasksByCategoryRef.current = tasksByCategory;

	const sensors = useSensors(
		useSensor(PointerSensor, {activationConstraint: {distance: 8}})
	);

	// ----- Data fetching ---------------------------------------------------

	const fetchBoard = useCallback(async () => {
		try {
			const orgId = localStorage.getItem("activeOrgId");

			const [boardResult, tasksResult, boardsResult] = await Promise.all([
				boardService.getBoard(boardId),
				taskService.getTasks(projectId),
				boardService.getBoards(projectId),
			]);

			if (!boardResult.error && boardResult.data) {
				const board = boardResult.data as unknown as {
					name: string;
					type?: "status" | "category";
					categories?: Category[];
				};
				setBoardName(board.name);
				const currentBoardType = board.type ?? "status";
				setBoardType(currentBoardType);
				const cats = (board.categories ?? []).sort(
					(a: Category, b: Category) => a.sortOrder - b.sortOrder
				);
				setCategories(cats);

				if (!boardsResult.error && boardsResult.data) {
					setBoards(boardsResult.data as unknown as Board[]);
				}

				if (!tasksResult.error && tasksResult.data) {
					const allTasks = tasksResult.data as unknown as Task[];
					const grouped: Record<string, Task[]> = {};

					if (currentBoardType === "status") {
						// Group tasks by matching task.status to category statusValue,
						// falling back to categoryId if no statusValue match is found
						for (const task of allTasks) {
							const matchingCat = cats.find(
								(c: Category) => c.statusValue && c.statusValue === task.status
							);
							const catByIdFallback =
								task.categoryId &&
								cats.find((c: Category) => c.id === task.categoryId);
							const catId = matchingCat
								? matchingCat.id
								: catByIdFallback
									? catByIdFallback.id
									: "uncategorized";
							if (!grouped[catId]) grouped[catId] = [];
							grouped[catId]!.push(task);
						}
					} else {
						// Category board: group by categoryId
						for (const task of allTasks) {
							const catId = task.categoryId || "uncategorized";
							if (!grouped[catId]) grouped[catId] = [];
							grouped[catId]!.push(task);
						}
					}

					for (const catId of Object.keys(grouped)) {
						grouped[catId]!.sort((a, b) => a.sortOrder - b.sortOrder);
					}
					setTasksByCategory(grouped);
				}
			} else {
				if (!boardsResult.error && boardsResult.data) {
					setBoards(boardsResult.data as unknown as Board[]);
				}
			}

			// Fetch members
			if (orgId) {
				const membersData = await apiFetch<Member[]>("/api/v1/members/", {
					headers: {"x-organization-id": orgId},
				});
				if (membersData) setMembers(membersData);
			}

			// Fetch project labels
			const labelsData = await apiFetch<Label[]>(
				`/api/v1/projects/${projectId}/labels/`
			);
			if (labelsData) setProjectLabels(labelsData);
		} finally {
			setLoading(false);
		}
	}, [boardId, projectId]);

	useEffect(() => {
		fetchBoard();
	}, [fetchBoard]);

	// ----- WebSocket -------------------------------------------------------

	useEffect(() => {
		const socket = io(API_BASE, {withCredentials: true});
		socketRef.current = socket;

		socket.on("connect", () => {
			socket.emit("join:board", boardId);
			socket.emit("join:project", projectId);
		});

		socket.on("task:created", (task: Task) => {
			setTasksByCategory((prev) => {
				// Determine the right column for this task
				let catId: string;
				if (boardType === "status") {
					const matchingCat = categories.find(
						(c) => c.statusValue === task.status
					);
					catId = matchingCat ? matchingCat.id : "uncategorized";
				} else {
					catId = task.categoryId || "uncategorized";
				}
				return {
					...prev,
					[catId]: [...(prev[catId] || []), task],
				};
			});
		});

		socket.on("task:updated", (task: Task) => {
			setTasksByCategory((prev) => {
				const next: Record<string, Task[]> = {};
				// Remove task from all columns first
				for (const catId of Object.keys(prev)) {
					next[catId] = prev[catId]!.filter((t) => t.id !== task.id);
				}
				// Place task in correct column
				let targetCatId: string;
				if (boardType === "status") {
					const matchingCat = categories.find(
						(c) => c.statusValue === task.status
					);
					targetCatId = matchingCat ? matchingCat.id : "uncategorized";
				} else {
					targetCatId = task.categoryId || "uncategorized";
				}
				next[targetCatId] = [...(next[targetCatId] || []), task];
				return next;
			});
		});

		socket.on("task:moved", (task: Task) => {
			setTasksByCategory((prev) => {
				const next: Record<string, Task[]> = {};
				for (const catId of Object.keys(prev)) {
					next[catId] = prev[catId]!.filter((t) => t.id !== task.id);
				}
				let newCatId: string;
				if (boardType === "status") {
					const matchingCat = categories.find(
						(c) => c.statusValue === task.status
					);
					newCatId = matchingCat ? matchingCat.id : "uncategorized";
				} else {
					newCatId = task.categoryId || "uncategorized";
				}
				next[newCatId] = [...(next[newCatId] || []), task];
				return next;
			});
		});

		socket.on("task:deleted", (data: {id: string}) => {
			setTasksByCategory((prev) => {
				const next = {...prev};
				for (const catId of Object.keys(next)) {
					next[catId] = next[catId]!.filter((t) => t.id !== data.id);
				}
				return next;
			});
		});

		return () => {
			socket.emit("leave:board", boardId);
			socket.emit("leave:project", projectId);
			socket.disconnect();
		};
	}, [boardId, projectId, boardType, categories]);

	// ----- Search & Filter -------------------------------------------------

	const filteredTasksByCategory = useMemo(() => {
		const result: Record<string, Task[]> = {};
		for (const [catId, tasks] of Object.entries(tasksByCategory)) {
			let filtered = tasks;

			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				filtered = filtered.filter(
					(t) =>
						t.title.toLowerCase().includes(q) ||
						(t.description || "").toLowerCase().includes(q)
				);
			}

			if (filterPriority !== "all") {
				filtered = filtered.filter((t) => t.priority === filterPriority);
			}

			if (filterAssignee !== "all") {
				if (filterAssignee === "unassigned") {
					filtered = filtered.filter((t) => !t.assigneeId);
				} else {
					filtered = filtered.filter((t) => t.assigneeId === filterAssignee);
				}
			}

			result[catId] = filtered;
		}
		return result;
	}, [tasksByCategory, searchQuery, filterPriority, filterAssignee]);

	// ----- Helpers ---------------------------------------------------------

	const findTaskById = useCallback((id: string): Task | undefined => {
		for (const tasks of Object.values(tasksByCategoryRef.current)) {
			const task = tasks.find((t) => t.id === id);
			if (task) return task;
		}
		return undefined;
	}, []);

	// ----- Drag & Drop -----------------------------------------------------

	const handleDragStart = useCallback(
		(event: DragStartEvent) => {
			const task = findTaskById(String(event.active.id));
			if (task) setActiveTask(task);
		},
		[findTaskById]
	);

	const handleDragOver = useCallback(
		(event: DragOverEvent) => {
			const {active, over} = event;
			if (!over) return;

			const activeId = String(active.id);
			const overId = String(over.id);

			const draggedTask = findTaskById(activeId);
			if (!draggedTask) return;

			// Find which category column the task is currently in
			let activeCategoryId: string = "uncategorized";
			for (const [catId, tasks] of Object.entries(tasksByCategoryRef.current)) {
				if (tasks.some((t) => t.id === activeId)) {
					activeCategoryId = catId;
					break;
				}
			}

			let overCategoryId: string;
			if (categories.some((c) => c.id === overId)) {
				overCategoryId = overId;
			} else {
				// Find which category the over task belongs to
				overCategoryId = "uncategorized";
				for (const [catId, tasks] of Object.entries(
					tasksByCategoryRef.current
				)) {
					if (tasks.some((t) => t.id === overId)) {
						overCategoryId = catId;
						break;
					}
				}
			}

			if (activeCategoryId === overCategoryId) return;

			setTasksByCategory((prev) => {
				const sourceTasks = [...(prev[activeCategoryId] || [])].filter(
					(t) => t.id !== activeId
				);
				const destTasks = [...(prev[overCategoryId] || [])];

				const targetCategory = categories.find((c) => c.id === overCategoryId);
				const movedTask: Task = {
					...draggedTask,
					categoryId: overCategoryId,
					...(boardType === "status" && targetCategory?.statusValue
						? {status: targetCategory.statusValue}
						: {}),
				};

				const overIndex = destTasks.findIndex((t) => t.id === overId);
				if (overIndex >= 0) {
					destTasks.splice(overIndex, 0, movedTask);
				} else {
					destTasks.push(movedTask);
				}

				return {
					...prev,
					[activeCategoryId]: sourceTasks,
					[overCategoryId]: destTasks,
				};
			});
		},
		[categories, findTaskById, boardType]
	);

	const handleDragEnd = useCallback(
		async (event: DragEndEvent) => {
			setActiveTask(null);
			const {active, over} = event;
			if (!over) return;

			const activeId = String(active.id);
			const overId = String(over.id);

			const draggedTask = findTaskById(activeId);
			if (!draggedTask) return;

			// Find which category column this task is in
			let categoryId: string = "uncategorized";
			for (const [catId, tasks] of Object.entries(tasksByCategoryRef.current)) {
				if (tasks.some((t) => t.id === activeId)) {
					categoryId = catId;
					break;
				}
			}

			if (activeId !== overId) {
				setTasksByCategory((prev) => {
					const tasks = [...(prev[categoryId] || [])];
					const oldIndex = tasks.findIndex((t) => t.id === activeId);
					const newIndex = tasks.findIndex((t) => t.id === overId);
					if (oldIndex >= 0 && newIndex >= 0) {
						return {
							...prev,
							[categoryId]: arrayMove(tasks, oldIndex, newIndex),
						};
					}
					return prev;
				});
			}

			const currentTasks = tasksByCategoryRef.current[categoryId] || [];
			const reorderItems = currentTasks.map((t, i) => ({
				id: t.id,
				sortOrder: i * 1000,
			}));

			const sortOrder =
				reorderItems.find((r) => r.id === activeId)?.sortOrder ?? 0;

			if (categoryId !== "uncategorized") {
				if (boardType === "status") {
					// Status board: update task.status to match the target column's statusValue
					const targetCategory = categories.find((c) => c.id === categoryId);
					const updatePayload: Record<string, unknown> = {
						sortOrder,
						categoryId,
					};
					if (targetCategory?.statusValue) {
						updatePayload.status = targetCategory.statusValue;
					}
					await taskService.updateTask(activeId, updatePayload);
				} else {
					// Category board: move task to the category
					await taskService.moveTask(activeId, {
						categoryId,
						sortOrder,
					});
				}
			}

			await taskService.reorderTasks(reorderItems);
		},
		[findTaskById, boardType, categories]
	);

	// ----- Task CRUD -------------------------------------------------------

	const handleCreateTask = useCallback(
		async (categoryId: string, title: string) => {
			const tasks = tasksByCategoryRef.current[categoryId] || [];
			const maxOrder =
				tasks.length > 0 ? Math.max(...tasks.map((t) => t.sortOrder)) : -1000;

			const createPayload: Record<string, unknown> = {
				title,
				sortOrder: maxOrder + 1000,
			};

			if (boardType === "status") {
				// Status board: set task.status to column's statusValue
				const category = categories.find((c) => c.id === categoryId);
				if (category?.statusValue) {
					createPayload.status = category.statusValue;
				}
				// Still set categoryId so the task is associated with this board's column
				createPayload.categoryId = categoryId;
			} else {
				// Category board: set categoryId
				createPayload.categoryId = categoryId;
			}

			const result = await taskService.createTask(
				projectId,
				createPayload as Parameters<typeof taskService.createTask>[1]
			);

			if (!result.error && result.data) {
				const newTask = result.data as unknown as Task;
				setTasksByCategory((prev) => ({
					...prev,
					[categoryId]: [...(prev[categoryId] || []), newTask],
				}));
			}
		},
		[projectId, boardType, categories]
	);

	const handleTaskClick = useCallback(async (task: Task) => {
		const result = await taskService.getTask(task.id);
		if (!result.error && result.data) {
			setSelectedTask(result.data as unknown as Task);
			setShowTaskModal(true);
		}
	}, []);

	const handleTaskUpdated = useCallback((updatedTask: Task) => {
		setTasksByCategory((prev) => {
			const next = {...prev};
			// Task might have moved categories
			let found = false;
			for (const catId of Object.keys(next)) {
				const idx = next[catId]!.findIndex((t) => t.id === updatedTask.id);
				if (idx >= 0) {
					if (updatedTask.categoryId && updatedTask.categoryId !== catId) {
						// Moved category
						next[catId] = next[catId]!.filter((t) => t.id !== updatedTask.id);
						const destCatId = updatedTask.categoryId;
						next[destCatId] = [...(next[destCatId] || []), updatedTask];
					} else {
						next[catId] = next[catId]!.map((t) =>
							t.id === updatedTask.id ? updatedTask : t
						);
					}
					found = true;
					break;
				}
			}
			if (!found && updatedTask.categoryId) {
				const catId = updatedTask.categoryId;
				next[catId] = [...(next[catId] || []), updatedTask];
			}
			return next;
		});
		setSelectedTask(updatedTask);
	}, []);

	const handleTaskDeleted = useCallback((taskId: string) => {
		setTasksByCategory((prev) => {
			const next = {...prev};
			for (const catId of Object.keys(next)) {
				next[catId] = next[catId]!.filter((t) => t.id !== taskId);
			}
			return next;
		});
		setShowTaskModal(false);
	}, []);

	// ----- Category CRUD ---------------------------------------------------

	const handleCreateCategory = useCallback(
		async (name: string, color?: string, statusValue?: string) => {
			const payload: {name: string; color?: string; statusValue?: string} = {
				name,
				color,
			};
			if (boardType === "status" && statusValue) {
				payload.statusValue = statusValue;
			}
			const result = await boardService.createCategory(boardId, payload);
			if (!result.error && result.data) {
				setCategories((prev) => [...prev, result.data as unknown as Category]);
			}
			setShowCreateCategoryModal(false);
		},
		[boardId, boardType]
	);

	const handleDeleteCategory = useCallback(
		async (categoryId: string) => {
			await boardService.deleteCategory(boardId, categoryId);
			setCategories((prev) => prev.filter((c) => c.id !== categoryId));
			setShowDeleteCategoryModal(null);
		},
		[boardId]
	);

	// ----- Board switching / creation --------------------------------------

	const handleBoardSwitch = useCallback(
		(newBoardId: string) => {
			router.push(`/dashboard/projects/${projectId}/boards/${newBoardId}`);
		},
		[projectId, router]
	);

	const handleCreateBoard = useCallback(
		async (name: string, type: "status" | "category") => {
			const result = await boardService.createBoard(projectId, {name, type});
			if (!result.error && result.data) {
				const newBoard = result.data as unknown as Board;
				setBoards((prev) => [...prev, newBoard]);
				setShowCreateBoardModal(false);
				router.push(`/dashboard/projects/${projectId}/boards/${newBoard.id}`);
			}
		},
		[projectId, router]
	);

	// ----- Flat tasks for list/calendar/timeline views ----------------------

	const allFilteredTasks = useMemo(() => {
		const tasks: Task[] = [];
		for (const catTasks of Object.values(filteredTasksByCategory)) {
			tasks.push(...catTasks);
		}
		return tasks;
	}, [filteredTasksByCategory]);

	// ----- Filter active ---------------------------------------------------

	const isFiltering =
		searchQuery || filterPriority !== "all" || filterAssignee !== "all";

	// ----- Loading skeleton ------------------------------------------------

	if (loading) {
		return (
			<div className="p-6 flex gap-4 overflow-x-auto h-full">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="w-72 shrink-0 space-y-3">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-16 w-full" />
					</div>
				))}
			</div>
		);
	}

	// ----- Render ----------------------------------------------------------

	return (
		<div className="h-full flex flex-col">
			{/* Board header */}
			<div className="px-6 py-3 flex items-center justify-between border-b border-border shrink-0 gap-3">
				<div className="flex items-center gap-3">
					{/* Board switcher */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="gap-1 text-lg font-semibold"
							>
								{boardName}
								<svg
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="M6 9l6 6 6-6" />
								</svg>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							{boards.map((b) => (
								<DropdownMenuItem
									key={b.id}
									onClick={() => handleBoardSwitch(b.id)}
								>
									{b.name}
									{b.type && (
										<span className="ml-1 text-xs text-muted-foreground">
											({b.type})
										</span>
									)}
									{b.id === boardId && (
										<span className="ml-auto text-primary">&#10003;</span>
									)}
								</DropdownMenuItem>
							))}
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => setShowCreateBoardModal(true)}>
								+ Create Board
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* View switcher */}
					<div className="flex items-center bg-muted rounded-md p-0.5 gap-0.5">
						{(
							[
								{
									key: "board",
									label: "Board",
									icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
								},
								{
									key: "list",
									label: "List",
									icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
								},
								{
									key: "calendar",
									label: "Calendar",
									icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
								},
								{
									key: "timeline",
									label: "Timeline",
									icon: "M2 12h4l3-9 4 18 3-9h4",
								},
							] as const
						).map(({key, label, icon}) => (
							<button
								key={key}
								onClick={() => setViewMode(key)}
								className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
									viewMode === key
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								}`}
								title={label}
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d={icon} />
								</svg>
								<span className="hidden sm:inline">{label}</span>
							</button>
						))}
					</div>
				</div>

				{/* Search & Filter bar */}
				<div className="flex items-center gap-2 flex-1 max-w-xl">
					{/* Search */}
					<div className="relative flex-1">
						<svg
							className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<circle cx="11" cy="11" r="8" />
							<path d="M21 21l-4.35-4.35" />
						</svg>
						<input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search tasks..."
							className="w-full pl-8 pr-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
						/>
						{searchQuery && (
							<button
								onClick={() => setSearchQuery("")}
								className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								&times;
							</button>
						)}
					</div>

					{/* Priority filter */}
					<select
						value={filterPriority}
						onChange={(e) => setFilterPriority(e.target.value)}
						className="text-xs border border-input rounded-md px-2 py-1.5 bg-background"
					>
						<option value="all">All Priority</option>
						<option value="urgent">Urgent</option>
						<option value="high">High</option>
						<option value="medium">Medium</option>
						<option value="low">Low</option>
						<option value="none">None</option>
					</select>

					{/* Assignee filter */}
					<select
						value={filterAssignee}
						onChange={(e) => setFilterAssignee(e.target.value)}
						className="text-xs border border-input rounded-md px-2 py-1.5 bg-background"
					>
						<option value="all">All Assignees</option>
						<option value="unassigned">Unassigned</option>
						{members.map((m) => (
							<option key={m.userId} value={m.userId}>
								{m.name}
							</option>
						))}
					</select>

					{isFiltering && (
						<Button
							variant="ghost"
							size="sm"
							className="text-xs h-7 px-2"
							onClick={() => {
								setSearchQuery("");
								setFilterPriority("all");
								setFilterAssignee("all");
							}}
						>
							Clear
						</Button>
					)}
				</div>
			</div>

			{/* View content */}
			{viewMode === "board" && (
				<div className="flex-1 overflow-x-auto overflow-y-hidden">
					<div className="flex gap-4 p-4 h-full items-start">
						<DndContext
							sensors={sensors}
							collisionDetection={closestCorners}
							onDragStart={handleDragStart}
							onDragOver={handleDragOver}
							onDragEnd={handleDragEnd}
						>
							{categories.map((category) => (
								<CategoryColumn
									key={category.id}
									category={category}
									tasks={filteredTasksByCategory[category.id] || []}
									totalCount={(tasksByCategory[category.id] || []).length}
									onCreateTask={handleCreateTask}
									onTaskClick={handleTaskClick}
									onDeleteCategory={(id) => setShowDeleteCategoryModal(id)}
									isFiltering={!!isFiltering}
								/>
							))}

							<DragOverlay dropAnimation={null}>
								{activeTask ? <TaskCardOverlay task={activeTask} /> : null}
							</DragOverlay>
						</DndContext>

						{/* Add category/status column */}
						<div className="w-72 shrink-0">
							<Button
								variant="outline"
								className="w-full border-dashed h-12"
								onClick={() => setShowCreateCategoryModal(true)}
							>
								{boardType === "status" ? "+ Add Status" : "+ Add Category"}
							</Button>
						</div>
					</div>
				</div>
			)}

			{viewMode === "list" && (
				<ListView
					tasks={allFilteredTasks}
					categories={categories}
					members={members}
					onTaskClick={handleTaskClick}
				/>
			)}

			{viewMode === "calendar" && (
				<CalendarView tasks={allFilteredTasks} onTaskClick={handleTaskClick} />
			)}

			{viewMode === "timeline" && (
				<TimelineView
					tasks={allFilteredTasks}
					categories={categories}
					onTaskClick={handleTaskClick}
				/>
			)}

			{/* Task Detail Modal */}
			<AnimatePresence>
				{showTaskModal && selectedTask && (
					<TaskDetailModal
						task={selectedTask}
						members={members}
						projectLabels={projectLabels}
						projectId={projectId}
						allTasksByCategory={tasksByCategory}
						onClose={() => setShowTaskModal(false)}
						onUpdate={handleTaskUpdated}
						onDelete={handleTaskDeleted}
						onLabelsChanged={(labels) => setProjectLabels(labels)}
					/>
				)}
			</AnimatePresence>

			{/* Create Category Modal */}
			{showCreateCategoryModal && (
				<CreateCategoryModal
					boardType={boardType}
					onClose={() => setShowCreateCategoryModal(false)}
					onCreated={handleCreateCategory}
				/>
			)}

			{/* Delete Category Confirmation Modal */}
			{showDeleteCategoryModal && (
				<ConfirmDeleteModal
					title={
						boardType === "status" ? "Delete Status Column" : "Delete Category"
					}
					message={
						boardType === "status"
							? "Delete this status column? Tasks with this status will need to be reassigned."
							: "Delete this category? Tasks in it will become uncategorized."
					}
					onCancel={() => setShowDeleteCategoryModal(null)}
					onConfirm={() => handleDeleteCategory(showDeleteCategoryModal)}
				/>
			)}

			{/* Create Board Modal */}
			{showCreateBoardModal && (
				<CreateBoardModal
					onClose={() => setShowCreateBoardModal(false)}
					onCreated={handleCreateBoard}
				/>
			)}
		</div>
	);
}

// ===========================================================================
// CreateCategoryModal
// ===========================================================================

const CATEGORY_COLORS = [
	{label: "Gray", value: "#6B7280"},
	{label: "Blue", value: "#3B82F6"},
	{label: "Green", value: "#10B981"},
	{label: "Amber", value: "#F59E0B"},
	{label: "Red", value: "#EF4444"},
	{label: "Purple", value: "#8B5CF6"},
	{label: "Pink", value: "#EC4899"},
	{label: "Teal", value: "#14B8A6"},
];

function CreateCategoryModal({
	boardType,
	onClose,
	onCreated,
}: {
	boardType: "status" | "category";
	onClose: () => void;
	onCreated: (name: string, color?: string, statusValue?: string) => void;
}) {
	const [name, setName] = useState("");
	const [color, setColor] = useState(CATEGORY_COLORS[0]!.value);
	const [statusValue, setStatusValue] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		if (boardType === "status" && !statusValue.trim()) return;
		setSubmitting(true);
		await onCreated(
			name.trim(),
			color,
			boardType === "status" ? statusValue.trim() : undefined
		);
		setSubmitting(false);
	};

	// Auto-generate statusValue from name
	const handleNameChange = (value: string) => {
		setName(value);
		if (boardType === "status" && !statusValue) {
			setStatusValue(
				value
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "_")
					.replace(/^_|_$/g, "")
			);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={onClose}
		>
			<div
				className="bg-background border border-border rounded-lg shadow-xl w-full max-w-sm mx-4"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="px-6 py-4 border-b border-border">
					<h2 className="text-lg font-semibold">
						{boardType === "status" ? "New Status Column" : "New Category"}
					</h2>
					<p className="text-sm text-muted-foreground mt-1">
						{boardType === "status"
							? "Add a status column. Tasks dragged here will get this status."
							: "Add a column to organize tasks."}
					</p>
				</div>

				<form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1.5">
							{boardType === "status" ? "Status Name" : "Category Name"}
						</label>
						<input
							autoFocus
							value={name}
							onChange={(e) => handleNameChange(e.target.value)}
							placeholder={
								boardType === "status"
									? "e.g. QA Testing, Blocked, Deployed"
									: "e.g. Backlog, In Review, QA"
							}
							className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>

					{boardType === "status" && (
						<div>
							<label className="block text-sm font-medium mb-1.5">
								Status Value
							</label>
							<input
								value={statusValue}
								onChange={(e) => setStatusValue(e.target.value)}
								placeholder="e.g. qa_testing, blocked"
								className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
							/>
							<p className="text-xs text-muted-foreground mt-1">
								Internal value used for task status. Use snake_case.
							</p>
						</div>
					)}

					<div>
						<label className="block text-sm font-medium mb-1.5">Color</label>
						<div className="flex gap-2 flex-wrap">
							{CATEGORY_COLORS.map((c) => (
								<button
									key={c.value}
									type="button"
									onClick={() => setColor(c.value)}
									className={`w-7 h-7 rounded-full border-2 transition-all ${
										color === c.value
											? "border-foreground scale-110"
											: "border-transparent hover:scale-105"
									}`}
									style={{backgroundColor: c.value}}
									title={c.label}
								/>
							))}
						</div>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							disabled={submitting}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={
								!name.trim() ||
								(boardType === "status" && !statusValue.trim()) ||
								submitting
							}
						>
							{submitting
								? "Creating..."
								: boardType === "status"
									? "Add Status"
									: "Add Category"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

// ===========================================================================
// CreateBoardModal
// ===========================================================================

function CreateBoardModal({
	onClose,
	onCreated,
}: {
	onClose: () => void;
	onCreated: (name: string, type: "status" | "category") => void;
}) {
	const [name, setName] = useState("");
	const [type, setType] = useState<"status" | "category">("status");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		setSubmitting(true);
		await onCreated(name.trim(), type);
		setSubmitting(false);
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={onClose}
		>
			<div
				className="bg-background border border-border rounded-lg shadow-xl w-full max-w-sm mx-4"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="px-6 py-4 border-b border-border">
					<h2 className="text-lg font-semibold">Create Board</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Add a new board to this project.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1.5">
							Board Name
						</label>
						<input
							autoFocus
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Sprint 1, Feature Board"
							className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1.5">
							Board Type
						</label>
						<div className="flex gap-3">
							<label
								className={`flex-1 flex items-center gap-2 p-3 border rounded-md cursor-pointer transition-colors ${
									type === "status"
										? "border-primary bg-primary/5"
										: "border-input hover:border-primary/50"
								}`}
							>
								<input
									type="radio"
									name="boardType"
									value="status"
									checked={type === "status"}
									onChange={() => setType("status")}
									className="accent-primary"
								/>
								<div>
									<div className="text-sm font-medium">Status Board</div>
									<div className="text-xs text-muted-foreground">
										Dragging updates task status
									</div>
								</div>
							</label>
							<label
								className={`flex-1 flex items-center gap-2 p-3 border rounded-md cursor-pointer transition-colors ${
									type === "category"
										? "border-primary bg-primary/5"
										: "border-input hover:border-primary/50"
								}`}
							>
								<input
									type="radio"
									name="boardType"
									value="category"
									checked={type === "category"}
									onChange={() => setType("category")}
									className="accent-primary"
								/>
								<div>
									<div className="text-sm font-medium">Category Board</div>
									<div className="text-xs text-muted-foreground">
										Dragging updates task category
									</div>
								</div>
							</label>
						</div>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							disabled={submitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!name.trim() || submitting}>
							{submitting ? "Creating..." : "Create Board"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

// ===========================================================================
// ConfirmDeleteModal
// ===========================================================================

function ConfirmDeleteModal({
	title,
	message,
	onCancel,
	onConfirm,
}: {
	title: string;
	message: string;
	onCancel: () => void;
	onConfirm: () => void;
}) {
	const [submitting, setSubmitting] = useState(false);

	const handleConfirm = async () => {
		setSubmitting(true);
		await onConfirm();
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={onCancel}
		>
			<div
				className="bg-background border border-border rounded-lg shadow-xl w-full max-w-sm mx-4"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="px-6 py-4 border-b border-border">
					<h2 className="text-lg font-semibold">{title}</h2>
				</div>
				<div className="px-6 py-4">
					<p className="text-sm text-muted-foreground">{message}</p>
				</div>
				<div className="px-6 py-3 border-t border-border flex justify-end gap-2">
					<Button variant="ghost" onClick={onCancel} disabled={submitting}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleConfirm}
						disabled={submitting}
					>
						{submitting ? "Deleting..." : "Delete"}
					</Button>
				</div>
			</div>
		</div>
	);
}

// ===========================================================================
// CategoryColumn
// ===========================================================================

function CategoryColumn({
	category,
	tasks,
	totalCount,
	onCreateTask,
	onTaskClick,
	onDeleteCategory,
	isFiltering,
}: {
	category: Category;
	tasks: Task[];
	totalCount: number;
	onCreateTask: (categoryId: string, title: string) => void;
	onTaskClick: (task: Task) => void;
	onDeleteCategory: (categoryId: string) => void;
	isFiltering: boolean;
}) {
	const [isAdding, setIsAdding] = useState(false);
	const [newTitle, setNewTitle] = useState("");

	const {setNodeRef} = useSortable({
		id: category.id,
		data: {type: "category"},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTitle.trim()) return;
		onCreateTask(category.id, newTitle.trim());
		setNewTitle("");
		setIsAdding(false);
	};

	return (
		<div
			ref={setNodeRef}
			className="w-72 shrink-0 flex flex-col max-h-full bg-muted/30 rounded-lg"
		>
			{/* Color bar */}
			<div
				className="h-1 rounded-t-lg"
				style={{
					backgroundColor: category.color || "#6B7280",
				}}
			/>

			{/* Column header */}
			<div className="px-3 py-2 flex items-center justify-between shrink-0">
				<div className="flex items-center gap-2">
					<div
						className="w-3 h-3 rounded-full shrink-0"
						style={{
							backgroundColor: category.color || "#6B7280",
						}}
					/>
					<span className="font-medium text-sm truncate">{category.name}</span>
					<span className="text-xs text-muted-foreground">
						{isFiltering
							? `${tasks.length}/${totalCount}`
							: `(${tasks.length})`}
					</span>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0 text-muted-foreground"
						>
							&middot;&middot;&middot;
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={() => onDeleteCategory(category.id)}
							className="text-destructive"
						>
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Task list */}
			<ScrollArea className="flex-1 px-2">
				<SortableContext
					items={tasks.map((t) => t.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="space-y-2 pb-2">
						<AnimatePresence initial={false}>
							{tasks.map((task) => (
								<SortableTaskCard
									key={task.id}
									task={task}
									onClick={() => onTaskClick(task)}
								/>
							))}
						</AnimatePresence>
					</div>
				</SortableContext>
			</ScrollArea>

			{/* Add task */}
			<div className="p-2 shrink-0">
				{isAdding ? (
					<form onSubmit={handleSubmit}>
						<input
							autoFocus
							value={newTitle}
							onChange={(e) => setNewTitle(e.target.value)}
							onBlur={() => {
								if (!newTitle.trim()) setIsAdding(false);
							}}
							onKeyDown={(e) => {
								if (e.key === "Escape") setIsAdding(false);
							}}
							placeholder="Task title..."
							className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
						/>
						<div className="flex gap-1 mt-1">
							<Button type="submit" size="sm" className="h-7 text-xs">
								Add
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-7 text-xs"
								onClick={() => setIsAdding(false)}
							>
								Cancel
							</Button>
						</div>
					</form>
				) : (
					<Button
						variant="ghost"
						size="sm"
						className="w-full text-muted-foreground justify-start h-8 text-xs"
						onClick={() => setIsAdding(true)}
					>
						+ Add task
					</Button>
				)}
			</div>
		</div>
	);
}

// ===========================================================================
// SortableTaskCard
// ===========================================================================

function SortableTaskCard({task, onClick}: {task: Task; onClick: () => void}) {
	const {attributes, listeners, setNodeRef, transform, transition, isDragging} =
		useSortable({
			id: task.id,
			data: {type: "task", task},
		});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
	};

	return (
		<motion.div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			layout
			initial={{opacity: 0, y: 10}}
			animate={{opacity: isDragging ? 0.4 : 1, y: 0}}
			exit={{opacity: 0, y: -10}}
			transition={{duration: 0.15}}
		>
			<TaskCardContent task={task} onClick={onClick} />
		</motion.div>
	);
}

// ===========================================================================
// TaskCardContent (shared between card and drag overlay)
// ===========================================================================

function TaskCardContent({task, onClick}: {task: Task; onClick?: () => void}) {
	const isOverdue =
		task.dueAt &&
		new Date(task.dueAt) < new Date() &&
		task.status !== "done" &&
		task.status !== "closed";

	return (
		<Card
			className="cursor-pointer hover:shadow-md transition-shadow"
			onClick={onClick}
		>
			<CardContent className="p-3 space-y-2">
				{/* Labels */}
				{task.labels && task.labels.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{task.labels.map((label) => (
							<div
								key={label.id}
								className="h-1.5 w-8 rounded-full"
								style={{backgroundColor: label.color}}
								title={label.name}
							/>
						))}
					</div>
				)}

				{/* Title */}
				<p className="text-sm font-medium leading-tight">{task.title}</p>

				{/* Meta row */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						{/* Priority indicator */}
						<div
							className={`w-2 h-2 rounded-full ${
								priorityColors[task.priority] || "bg-gray-400"
							}`}
							title={task.priority}
						/>

						{/* Due date */}
						{task.dueAt && (
							<span
								className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}
							>
								{new Date(task.dueAt).toLocaleDateString("en", {
									month: "short",
									day: "numeric",
								})}
							</span>
						)}

						{/* Status badge for non-open tasks */}
						{task.status !== "open" && (
							<Badge variant="outline" className="text-[10px] h-4 px-1">
								{statusLabels[task.status] || task.status}
							</Badge>
						)}

						{/* Effort level badge */}
						{task.effortLevel && (
							<Badge
								variant="outline"
								className={`text-[10px] h-4 px-1 ${
									task.effortLevel === "low"
										? "border-green-400 text-green-600"
										: task.effortLevel === "medium"
											? "border-yellow-400 text-yellow-600"
											: "border-red-400 text-red-600"
								}`}
							>
								{task.effortLevel === "low"
									? "Low"
									: task.effortLevel === "medium"
										? "Med"
										: "High"}
							</Badge>
						)}
					</div>

					{/* Assignee avatar */}
					{task.assignee && (
						<Avatar className="h-5 w-5">
							<AvatarFallback className="text-[10px]">
								{task.assignee.name.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

// ===========================================================================
// TaskCardOverlay (rendered inside DragOverlay)
// ===========================================================================

function TaskCardOverlay({task}: {task: Task}) {
	return (
		<div className="w-72 rotate-2 opacity-90 shadow-lg">
			<TaskCardContent task={task} />
		</div>
	);
}

// ===========================================================================
// TaskDetailModal
// ===========================================================================

function TaskDetailModal({
	task,
	members,
	projectLabels,
	projectId,
	allTasksByCategory,
	onClose,
	onUpdate,
	onDelete,
	onLabelsChanged,
}: {
	task: Task;
	members: Member[];
	projectLabels: Label[];
	projectId: string;
	allTasksByCategory: Record<string, Task[]>;
	onClose: () => void;
	onUpdate: (task: Task) => void;
	onDelete: (taskId: string) => void;
	onLabelsChanged: (labels: Label[]) => void;
}) {
	const [title, setTitle] = useState(task.title);
	const [description, setDescription] = useState(task.description || "");
	const [priority, setPriority] = useState(task.priority);
	const [status, setStatus] = useState(task.status);
	const [assigneeId, setAssigneeId] = useState(task.assigneeId || "");
	const [dueAt, setDueAt] = useState(
		task.dueAt ? task.dueAt.split("T")[0] : ""
	);
	const [startAt, setStartAt] = useState(
		task.startAt ? task.startAt.split("T")[0] : ""
	);
	const [effortLevel, setEffortLevel] = useState(task.effortLevel || "");
	const [taskLabelsState, setTaskLabelsState] = useState<Label[]>(
		task.labels || []
	);
	const [comments, setComments] = useState<Comment[]>([]);
	const [activities, setActivities] = useState<Activity[]>([]);
	const [newComment, setNewComment] = useState("");
	const [activeTab, setActiveTab] = useState<
		"contents" | "comments" | "activity" | "dependencies"
	>("contents");
	const [showLabelPicker, setShowLabelPicker] = useState(false);
	const [newLabelName, setNewLabelName] = useState("");
	const [newLabelColor, setNewLabelColor] = useState("#3B82F6");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleting, setDeleting] = useState(false);

	// Dependencies state
	interface Dependency {
		id: string;
		dependentTaskId: string;
		dependsOnTaskId: string;
		dependencyType: string;
		createdAt: string;
		dependsOnTask?: {
			id: string;
			title: string;
			status: string;
			categoryId: string | null;
		};
		dependentTask?: {
			id: string;
			title: string;
			status: string;
			categoryId: string | null;
		};
	}
	const [blockedBy, setBlockedBy] = useState<Dependency[]>([]);
	const [blocking, setBlocking] = useState<Dependency[]>([]);
	const [depSearchQuery, setDepSearchQuery] = useState("");
	const [depSearchResults, setDepSearchResults] = useState<Task[]>([]);
	const [addingDep, setAddingDep] = useState(false);
	const [showDepSearch, setShowDepSearch] = useState(false);

	// Task contents state
	const [contents, setContents] = useState<TaskContent[]>([]);
	const [showAddContent, setShowAddContent] = useState(false);
	const [newContentType, setNewContentType] = useState<
		"code" | "doc" | "link" | "note"
	>("note");
	const [newContentTitle, setNewContentTitle] = useState("");
	const [newContentBody, setNewContentBody] = useState("");
	const [newContentLanguage, setNewContentLanguage] = useState("");
	const [newContentUrl, setNewContentUrl] = useState("");
	const [editingContentId, setEditingContentId] = useState<string | null>(null);
	const [editContentBody, setEditContentBody] = useState("");
	const [editContentTitle, setEditContentTitle] = useState("");

	// Load contents on mount
	useEffect(() => {
		(async () => {
			const data = await apiFetch<TaskContent[]>(
				`/api/v1/tasks/${task.id}/contents/`
			);
			if (data) setContents(data);
		})();
	}, [task.id]);

	// Load comments on mount
	useEffect(() => {
		(async () => {
			const result = await commentService.getComments(task.id);
			if (!result.error && result.data) {
				setComments(result.data as unknown as Comment[]);
			}
		})();
	}, [task.id]);

	// Load activities when tab is switched
	useEffect(() => {
		if (activeTab !== "activity") return;
		(async () => {
			const data = await apiFetch<Activity[]>(
				`/api/v1/tasks/${task.id}/activity/`
			);
			if (data) setActivities(data);
		})();
	}, [activeTab, task.id]);

	// Load dependencies when tab is switched
	useEffect(() => {
		if (activeTab !== "dependencies") return;
		(async () => {
			const result = await taskService.getDependencies(task.id);
			if (!result.error && result.data) {
				const deps = result.data as unknown as {
					blockedBy: Dependency[];
					blocking: Dependency[];
				};
				setBlockedBy(deps.blockedBy || []);
				setBlocking(deps.blocking || []);
			}
		})();
	}, [activeTab, task.id]);

	// Close on Escape key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	const handleSaveTitle = async () => {
		if (title === task.title) return;
		const result = await taskService.updateTask(task.id, {title});
		if (!result.error && result.data) {
			onUpdate(result.data as unknown as Task);
		}
	};

	const handleSaveDescription = async () => {
		if (description === (task.description || "")) return;
		const result = await taskService.updateTask(task.id, {
			description: description || null,
		});
		if (!result.error && result.data) {
			onUpdate(result.data as unknown as Task);
		}
	};

	const handlePriorityChange = async (newPriority: string) => {
		setPriority(newPriority);
		const result = await taskService.updateTask(task.id, {
			priority: newPriority,
		});
		if (!result.error && result.data) {
			onUpdate(result.data as unknown as Task);
		}
	};

	const handleStatusChange = async (newStatus: string) => {
		setStatus(newStatus);
		const result = await taskService.updateTask(task.id, {
			status: newStatus,
		});
		if (!result.error && result.data) {
			onUpdate(result.data as unknown as Task);
		}
	};

	const handleAssigneeChange = async (newAssigneeId: string) => {
		const val = newAssigneeId || null;
		setAssigneeId(newAssigneeId);
		const result = await taskService.updateTask(task.id, {
			assigneeId: val,
		});
		if (!result.error && result.data) {
			onUpdate(result.data as unknown as Task);
		}
	};

	const handleDueDateChange = async (newDate: string) => {
		setDueAt(newDate);
		const result = await taskService.updateTask(task.id, {
			dueAt: newDate ? new Date(newDate).toISOString() : null,
		});
		if (!result.error && result.data) {
			onUpdate(result.data as unknown as Task);
		}
	};

	const handleStartDateChange = async (newDate: string) => {
		setStartAt(newDate);
		const result = await taskService.updateTask(task.id, {
			startAt: newDate ? new Date(newDate).toISOString() : null,
		});
		if (!result.error && result.data) {
			onUpdate(result.data as unknown as Task);
		}
	};

	const handleEffortLevelChange = async (newLevel: string) => {
		setEffortLevel(newLevel);
		const result = await taskService.updateTask(task.id, {
			effortLevel: newLevel || null,
		});
		if (!result.error && result.data) {
			onUpdate(result.data as unknown as Task);
		}
	};

	// Content CRUD handlers
	const handleAddContent = async () => {
		if (!newContentBody.trim()) return;
		const payload: Record<string, unknown> = {
			type: newContentType,
			content: newContentBody.trim(),
		};
		if (newContentTitle.trim()) payload.title = newContentTitle.trim();
		if (newContentType === "code" && newContentLanguage.trim())
			payload.language = newContentLanguage.trim();
		if (newContentType === "link" && newContentUrl.trim())
			payload.url = newContentUrl.trim();

		const data = await apiFetch<TaskContent>(
			`/api/v1/tasks/${task.id}/contents/`,
			{
				method: "POST",
				body: JSON.stringify(payload),
			}
		);
		if (data) {
			setContents((prev) => [...prev, data]);
			setShowAddContent(false);
			setNewContentTitle("");
			setNewContentBody("");
			setNewContentLanguage("");
			setNewContentUrl("");
		}
	};

	const handleUpdateContent = async (contentId: string) => {
		const payload: Record<string, unknown> = {};
		if (editContentTitle !== undefined)
			payload.title = editContentTitle || null;
		if (editContentBody.trim()) payload.content = editContentBody.trim();

		const data = await apiFetch<TaskContent>(
			`/api/v1/tasks/${task.id}/contents/${contentId}`,
			{
				method: "PATCH",
				body: JSON.stringify(payload),
			}
		);
		if (data) {
			setContents((prev) => prev.map((c) => (c.id === contentId ? data : c)));
			setEditingContentId(null);
		}
	};

	const handleDeleteContent = async (contentId: string) => {
		await apiFetch(`/api/v1/tasks/${task.id}/contents/${contentId}`, {
			method: "DELETE",
		});
		setContents((prev) => prev.filter((c) => c.id !== contentId));
	};

	const handleAddComment = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newComment.trim()) return;
		const result = await commentService.createComment(task.id, {
			content: newComment.trim(),
		});
		if (!result.error && result.data) {
			setComments((prev) => [...prev, result.data as unknown as Comment]);
			setNewComment("");
		}
	};

	const handleDelete = async () => {
		setDeleting(true);
		await taskService.deleteTask(task.id);
		onDelete(task.id);
	};

	// Dependency management
	const handleSearchTasks = useCallback(
		(query: string) => {
			setDepSearchQuery(query);
			if (!query.trim()) {
				setDepSearchResults([]);
				return;
			}
			// Search through all tasks in the board (from parent's tasksByCategory)
			const allTasks: Task[] = [];
			for (const catId of Object.keys(tasksByCategoryRef.current)) {
				for (const t of tasksByCategoryRef.current[catId] || []) {
					if (t.id !== task.id) allTasks.push(t);
				}
			}
			const q = query.toLowerCase();
			setDepSearchResults(
				allTasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 8)
			);
		},
		[task.id]
	);

	const handleAddDependency = async (dependsOnTaskId: string) => {
		setAddingDep(true);
		const result = await taskService.addDependency(task.id, dependsOnTaskId);
		if (!result.error && result.data) {
			setBlockedBy((prev) => [...prev, result.data as unknown as Dependency]);
			setDepSearchQuery("");
			setDepSearchResults([]);
			setShowDepSearch(false);
		}
		setAddingDep(false);
	};

	const handleRemoveDependency = async (depId: string) => {
		await taskService.removeDependency(task.id, depId);
		setBlockedBy((prev) => prev.filter((d) => d.id !== depId));
		setBlocking((prev) => prev.filter((d) => d.id !== depId));
	};

	// We need access to all tasks for dependency search
	const tasksByCategoryRef = useRef<Record<string, Task[]>>(allTasksByCategory);
	tasksByCategoryRef.current = allTasksByCategory;

	// Label management
	const handleAddLabelToTask = async (label: Label) => {
		await apiFetch(`/api/v1/tasks/${task.id}/labels/${label.id}`, {
			method: "POST",
		});
		setTaskLabelsState((prev) => [...prev, label]);
		// Re-fetch task to update card
		const result = await taskService.getTask(task.id);
		if (!result.error && result.data) {
			onUpdate(result.data as unknown as Task);
		}
	};

	const handleRemoveLabelFromTask = async (labelId: string) => {
		await apiFetch(`/api/v1/tasks/${task.id}/labels/${labelId}`, {
			method: "DELETE",
		});
		setTaskLabelsState((prev) => prev.filter((l) => l.id !== labelId));
		const result = await taskService.getTask(task.id);
		if (!result.error && result.data) {
			onUpdate(result.data as unknown as Task);
		}
	};

	const handleCreateLabel = async () => {
		if (!newLabelName.trim()) return;
		const data = await apiFetch<Label>(
			`/api/v1/projects/${projectId}/labels/`,
			{
				method: "POST",
				body: JSON.stringify({name: newLabelName.trim(), color: newLabelColor}),
			}
		);
		if (data) {
			onLabelsChanged([...projectLabels, data]);
			await handleAddLabelToTask(data);
			setNewLabelName("");
		}
	};

	const labelColors = [
		"#3B82F6",
		"#10B981",
		"#F59E0B",
		"#EF4444",
		"#8B5CF6",
		"#EC4899",
		"#6366F1",
		"#14B8A6",
		"#F97316",
		"#64748B",
	];

	return (
		<motion.div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={onClose}
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}
		>
			<motion.div
				initial={{opacity: 0, scale: 0.95}}
				animate={{opacity: 1, scale: 1}}
				exit={{opacity: 0, scale: 0.95}}
				transition={{duration: 0.15}}
				className="bg-background border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="px-6 py-4 border-b border-border flex items-start justify-between shrink-0">
					<div className="flex-1 mr-4">
						<input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							onBlur={handleSaveTitle}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.currentTarget.blur();
								}
							}}
							className="text-lg font-semibold bg-transparent border-none outline-none w-full focus:ring-0"
						/>
					</div>
					<div className="flex gap-1 shrink-0">
						{showDeleteConfirm ? (
							<div className="flex items-center gap-1.5 bg-destructive/10 rounded-md px-2 py-1">
								<span className="text-xs text-destructive font-medium">
									Delete?
								</span>
								<Button
									variant="destructive"
									size="sm"
									className="h-6 px-2 text-xs"
									onClick={handleDelete}
									disabled={deleting}
								>
									{deleting ? "..." : "Yes"}
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="h-6 px-2 text-xs"
									onClick={() => setShowDeleteConfirm(false)}
									disabled={deleting}
								>
									No
								</Button>
							</div>
						) : (
							<Button
								variant="ghost"
								size="sm"
								className="text-destructive"
								onClick={() => setShowDeleteConfirm(true)}
							>
								Delete
							</Button>
						)}
						<Button variant="ghost" size="sm" onClick={onClose}>
							&times;
						</Button>
					</div>
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
					{/* Meta row: Priority + Status + Assignee + Dates */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs text-muted-foreground block mb-1">
								Priority
							</label>
							<select
								value={priority}
								onChange={(e) => handlePriorityChange(e.target.value)}
								className="w-full text-sm border border-input rounded-md px-2 py-1.5 bg-background"
							>
								{Object.entries(priorityLabels).map(([k, v]) => (
									<option key={k} value={k}>
										{v}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="text-xs text-muted-foreground block mb-1">
								Status
							</label>
							<select
								value={status}
								onChange={(e) => handleStatusChange(e.target.value)}
								className="w-full text-sm border border-input rounded-md px-2 py-1.5 bg-background"
							>
								{Object.entries(statusLabels).map(([k, v]) => (
									<option key={k} value={k}>
										{v}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="text-xs text-muted-foreground block mb-1">
								Assignee
							</label>
							<select
								value={assigneeId}
								onChange={(e) => handleAssigneeChange(e.target.value)}
								className="w-full text-sm border border-input rounded-md px-2 py-1.5 bg-background"
							>
								<option value="">Unassigned</option>
								{members.map((m) => (
									<option key={m.userId} value={m.userId}>
										{m.name}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="text-xs text-muted-foreground block mb-1">
								Start Date
							</label>
							<Popover>
								<PopoverTrigger asChild>
									<button className="w-full text-left text-sm border border-input rounded-md px-2 py-1.5 bg-background hover:bg-accent transition-colors flex items-center justify-between">
										<span
											className={
												startAt ? "text-foreground" : "text-muted-foreground"
											}
										>
											{startAt
												? format(new Date(startAt + "T00:00:00"), "MMM d, yyyy")
												: "Pick a date"}
										</span>
										{startAt && (
											<span
												className="text-muted-foreground hover:text-foreground text-xs ml-1"
												onClick={(e) => {
													e.stopPropagation();
													handleStartDateChange("");
												}}
											>
												✕
											</span>
										)}
									</button>
								</PopoverTrigger>
								<PopoverContent
									className="w-auto p-0"
									align="start"
									sideOffset={4}
								>
									<Calendar
										mode="single"
										selected={
											startAt ? new Date(startAt + "T00:00:00") : undefined
										}
										onSelect={(date) => {
											if (date) {
												const formatted = format(date, "yyyy-MM-dd");
												handleStartDateChange(formatted);
											}
										}}
										defaultMonth={
											startAt ? new Date(startAt + "T00:00:00") : undefined
										}
									/>
								</PopoverContent>
							</Popover>
						</div>
						<div>
							<label className="text-xs text-muted-foreground block mb-1">
								Due Date
							</label>
							<Popover>
								<PopoverTrigger asChild>
									<button className="w-full text-left text-sm border border-input rounded-md px-2 py-1.5 bg-background hover:bg-accent transition-colors flex items-center justify-between">
										<span
											className={
												dueAt ? "text-foreground" : "text-muted-foreground"
											}
										>
											{dueAt
												? format(new Date(dueAt + "T00:00:00"), "MMM d, yyyy")
												: "Pick a date"}
										</span>
										{dueAt && (
											<span
												className="text-muted-foreground hover:text-foreground text-xs ml-1"
												onClick={(e) => {
													e.stopPropagation();
													handleDueDateChange("");
												}}
											>
												✕
											</span>
										)}
									</button>
								</PopoverTrigger>
								<PopoverContent
									className="w-auto p-0"
									align="start"
									sideOffset={4}
								>
									<Calendar
										mode="single"
										selected={dueAt ? new Date(dueAt + "T00:00:00") : undefined}
										onSelect={(date) => {
											if (date) {
												const formatted = format(date, "yyyy-MM-dd");
												handleDueDateChange(formatted);
											}
										}}
										defaultMonth={
											dueAt ? new Date(dueAt + "T00:00:00") : undefined
										}
									/>
								</PopoverContent>
							</Popover>
						</div>
						<div>
							<label className="text-xs text-muted-foreground block mb-1">
								Effort Level
							</label>
							<select
								value={effortLevel}
								onChange={(e) => handleEffortLevelChange(e.target.value)}
								className="w-full text-sm border border-input rounded-md px-2 py-1.5 bg-background"
							>
								<option value="">Not set</option>
								<option value="low">Low Effort</option>
								<option value="medium">Medium Effort</option>
								<option value="high">High Effort</option>
							</select>
						</div>
					</div>

					{/* Labels */}
					<div>
						<label className="text-xs text-muted-foreground block mb-1">
							Labels
						</label>
						<div className="flex flex-wrap gap-1.5 items-center">
							{taskLabelsState.map((label) => (
								<Badge
									key={label.id}
									className="text-xs h-6 gap-1 cursor-default"
									style={{backgroundColor: label.color, color: "#fff"}}
								>
									{label.name}
									<button
										onClick={() => handleRemoveLabelFromTask(label.id)}
										className="ml-0.5 hover:opacity-70"
									>
										&times;
									</button>
								</Badge>
							))}
							<Button
								variant="outline"
								size="sm"
								className="h-6 text-xs px-2"
								onClick={() => setShowLabelPicker(!showLabelPicker)}
							>
								+ Label
							</Button>
						</div>

						{/* Label picker */}
						{showLabelPicker && (
							<div className="mt-2 p-3 border border-border rounded-md bg-background space-y-2">
								{/* Existing project labels not on this task */}
								{projectLabels
									.filter((l) => !taskLabelsState.some((tl) => tl.id === l.id))
									.map((label) => (
										<button
											key={label.id}
											onClick={() => handleAddLabelToTask(label)}
											className="flex items-center gap-2 w-full text-left px-2 py-1 rounded hover:bg-muted text-sm"
										>
											<div
												className="w-3 h-3 rounded-full"
												style={{backgroundColor: label.color}}
											/>
											{label.name}
										</button>
									))}

								{/* Create new label */}
								<div className="border-t border-border pt-2 mt-2">
									<div className="flex gap-2">
										<input
											value={newLabelName}
											onChange={(e) => setNewLabelName(e.target.value)}
											placeholder="New label..."
											className="flex-1 px-2 py-1 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
											onKeyDown={(e) => {
												if (e.key === "Enter") handleCreateLabel();
											}}
										/>
										<Button
											size="sm"
											className="h-7 text-xs"
											onClick={handleCreateLabel}
										>
											Add
										</Button>
									</div>
									<div className="flex gap-1 mt-1.5">
										{labelColors.map((c) => (
											<button
												key={c}
												className={`w-5 h-5 rounded-full border-2 ${newLabelColor === c ? "border-foreground" : "border-transparent"}`}
												style={{backgroundColor: c}}
												onClick={() => setNewLabelColor(c)}
											/>
										))}
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Description */}
					<div>
						<label className="text-xs text-muted-foreground block mb-1">
							Description
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							onBlur={handleSaveDescription}
							rows={4}
							className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
							placeholder="Add a description..."
						/>
					</div>

					{/* Tabs: Contents, Comments, Activity, Dependencies */}
					<div className="border-t border-border pt-4">
						<div className="flex gap-4 mb-3">
							<button
								className={`text-sm font-medium pb-1 ${
									activeTab === "contents"
										? "border-b-2 border-primary text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
								onClick={() => setActiveTab("contents")}
							>
								Contents ({contents.length})
							</button>
							<button
								className={`text-sm font-medium pb-1 ${
									activeTab === "comments"
										? "border-b-2 border-primary text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
								onClick={() => setActiveTab("comments")}
							>
								Comments ({comments.length})
							</button>
							<button
								className={`text-sm font-medium pb-1 ${
									activeTab === "activity"
										? "border-b-2 border-primary text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
								onClick={() => setActiveTab("activity")}
							>
								Activity ({activities.length})
							</button>
							<button
								className={`text-sm font-medium pb-1 ${
									activeTab === "dependencies"
										? "border-b-2 border-primary text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
								onClick={() => setActiveTab("dependencies")}
							>
								Dependencies ({blockedBy.length + blocking.length})
							</button>
						</div>

						{activeTab === "contents" && (
							<div className="space-y-3">
								{contents.length === 0 && !showAddContent && (
									<p className="text-sm text-muted-foreground">
										No content blocks yet. Add code snippets, docs, links, or
										notes.
									</p>
								)}
								{contents.map((item) => (
									<div
										key={item.id}
										className="border border-border rounded-lg p-3 space-y-2"
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span
													className={`text-xs px-2 py-0.5 rounded font-medium ${
														item.type === "code"
															? "bg-violet-500/20 text-violet-400"
															: item.type === "doc"
																? "bg-blue-500/20 text-blue-400"
																: item.type === "link"
																	? "bg-green-500/20 text-green-400"
																	: "bg-yellow-500/20 text-yellow-400"
													}`}
												>
													{item.type === "code"
														? "💻 Code"
														: item.type === "doc"
															? "📄 Doc"
															: item.type === "link"
																? "🔗 Link"
																: "📝 Note"}
												</span>
												{item.title && (
													<span className="text-sm font-medium">
														{item.title}
													</span>
												)}
												{item.type === "code" && item.language && (
													<span className="text-xs text-muted-foreground">
														{item.language}
													</span>
												)}
											</div>
											<div className="flex items-center gap-1">
												<button
													className="text-xs text-muted-foreground hover:text-foreground"
													onClick={() => {
														setEditingContentId(item.id);
														setEditContentBody(item.content);
														setEditContentTitle(item.title || "");
													}}
												>
													Edit
												</button>
												<button
													className="text-xs text-red-400 hover:text-red-300"
													onClick={() => handleDeleteContent(item.id)}
												>
													Delete
												</button>
											</div>
										</div>
										{editingContentId === item.id ? (
											<div className="space-y-2">
												<input
													value={editContentTitle}
													onChange={(e) => setEditContentTitle(e.target.value)}
													placeholder="Title (optional)"
													className="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
												/>
												<textarea
													value={editContentBody}
													onChange={(e) => setEditContentBody(e.target.value)}
													rows={item.type === "code" ? 8 : 4}
													className={`w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y ${
														item.type === "code" ? "font-mono text-xs" : ""
													}`}
												/>
												<div className="flex gap-2">
													<Button
														size="sm"
														onClick={() => handleUpdateContent(item.id)}
													>
														Save
													</Button>
													<Button
														size="sm"
														variant="ghost"
														onClick={() => setEditingContentId(null)}
													>
														Cancel
													</Button>
												</div>
											</div>
										) : (
											<div>
												{item.type === "code" ? (
													<pre className="bg-muted/50 rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
														<code>{item.content}</code>
													</pre>
												) : item.type === "link" ? (
													<div className="space-y-1">
														{item.url && (
															<a
																href={item.url}
																target="_blank"
																rel="noopener noreferrer"
																className="text-sm text-blue-400 hover:underline break-all"
															>
																{item.url}
															</a>
														)}
														{item.content && (
															<p className="text-sm text-muted-foreground">
																{item.content}
															</p>
														)}
													</div>
												) : (
													<div className="text-sm whitespace-pre-wrap">
														{item.content}
													</div>
												)}
											</div>
										)}
										<div className="text-xs text-muted-foreground">
											{item.user?.name || "Unknown"} ·{" "}
											{new Date(item.updatedAt).toLocaleString()}
										</div>
									</div>
								))}

								{showAddContent ? (
									<div className="border border-border rounded-lg p-3 space-y-3">
										<div className="flex gap-2">
											{(["note", "code", "doc", "link"] as const).map((t) => (
												<button
													key={t}
													className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
														newContentType === t
															? "bg-primary text-primary-foreground"
															: "bg-muted text-muted-foreground hover:text-foreground"
													}`}
													onClick={() => setNewContentType(t)}
												>
													{t === "code"
														? "💻 Code"
														: t === "doc"
															? "📄 Doc"
															: t === "link"
																? "🔗 Link"
																: "📝 Note"}
												</button>
											))}
										</div>
										<input
											value={newContentTitle}
											onChange={(e) => setNewContentTitle(e.target.value)}
											placeholder="Title (optional)"
											className="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
										/>
										{newContentType === "code" && (
											<input
												value={newContentLanguage}
												onChange={(e) => setNewContentLanguage(e.target.value)}
												placeholder="Language (e.g. javascript, python)"
												className="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
											/>
										)}
										{newContentType === "link" && (
											<input
												value={newContentUrl}
												onChange={(e) => setNewContentUrl(e.target.value)}
												placeholder="URL (e.g. https://example.com)"
												className="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
											/>
										)}
										<textarea
											value={newContentBody}
											onChange={(e) => setNewContentBody(e.target.value)}
											rows={newContentType === "code" ? 8 : 4}
											placeholder={
												newContentType === "code"
													? "Paste your code here..."
													: newContentType === "link"
														? "Description (optional)"
														: newContentType === "doc"
															? "Write your documentation..."
															: "Write a note..."
											}
											className={`w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y ${
												newContentType === "code" ? "font-mono text-xs" : ""
											}`}
										/>
										<div className="flex gap-2">
											<Button size="sm" onClick={handleAddContent}>
												Add {newContentType}
											</Button>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => {
													setShowAddContent(false);
													setNewContentTitle("");
													setNewContentBody("");
													setNewContentLanguage("");
													setNewContentUrl("");
												}}
											>
												Cancel
											</Button>
										</div>
									</div>
								) : (
									<Button
										size="sm"
										variant="outline"
										onClick={() => setShowAddContent(true)}
									>
										+ Add Content
									</Button>
								)}
							</div>
						)}

						{activeTab === "comments" && (
							<div className="space-y-3">
								{comments.length === 0 && (
									<p className="text-sm text-muted-foreground">
										No comments yet.
									</p>
								)}
								{comments.map((comment) => (
									<div key={comment.id} className="flex gap-2">
										<Avatar className="h-6 w-6 shrink-0 mt-0.5">
											<AvatarFallback className="text-[10px]">
												{comment.user?.name?.charAt(0).toUpperCase() || "?"}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1">
											<div className="flex items-center gap-2">
												<span className="text-xs font-medium">
													{comment.user?.name || "Unknown"}
												</span>
												<span className="text-xs text-muted-foreground">
													{new Date(comment.createdAt).toLocaleString()}
												</span>
												{comment.isEdited && (
													<span className="text-xs text-muted-foreground italic">
														(edited)
													</span>
												)}
											</div>
											<p className="text-sm mt-0.5">{comment.content}</p>
										</div>
									</div>
								))}

								<form onSubmit={handleAddComment} className="flex gap-2">
									<input
										value={newComment}
										onChange={(e) => setNewComment(e.target.value)}
										placeholder="Write a comment..."
										className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
									/>
									<Button type="submit" size="sm">
										Send
									</Button>
								</form>
							</div>
						)}

						{activeTab === "activity" && (
							<div className="space-y-2">
								{activities.length === 0 && (
									<p className="text-sm text-muted-foreground">
										No activity yet.
									</p>
								)}
								{activities.map((activity) => (
									<div key={activity.id} className="flex gap-2 items-start">
										<Avatar className="h-5 w-5 shrink-0 mt-0.5">
											<AvatarFallback className="text-[10px]">
												{activity.user?.name?.charAt(0).toUpperCase() || "?"}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1">
											<p className="text-xs">
												<span className="font-medium">
													{activity.user?.name || "Someone"}
												</span>{" "}
												{activity.action === "created" && "created this task"}
												{activity.action === "updated" && activity.field && (
													<>
														changed{" "}
														<span className="font-medium">
															{activity.field}
														</span>
														{activity.oldValue && (
															<>
																{" "}
																from{" "}
																<span className="line-through text-muted-foreground">
																	{activity.oldValue}
																</span>
															</>
														)}
														{activity.newValue && (
															<>
																{" "}
																to{" "}
																<span className="font-medium">
																	{activity.newValue}
																</span>
															</>
														)}
													</>
												)}
												{activity.action === "moved" && "moved this task"}
												{activity.action === "commented" && "added a comment"}
												{activity.action === "assigned" && (
													<>
														assigned to{" "}
														<span className="font-medium">
															{activity.newValue}
														</span>
													</>
												)}
											</p>
											<span className="text-xs text-muted-foreground">
												{new Date(activity.createdAt).toLocaleString()}
											</span>
										</div>
									</div>
								))}
							</div>
						)}

						{activeTab === "dependencies" && (
							<div className="space-y-4">
								{/* Add dependency search */}
								<div className="relative">
									{!showDepSearch ? (
										<Button
											variant="outline"
											size="sm"
											className="w-full border-dashed"
											onClick={() => setShowDepSearch(true)}
										>
											+ Add Dependency
										</Button>
									) : (
										<div className="space-y-2">
											<input
												autoFocus
												value={depSearchQuery}
												onChange={(e) => handleSearchTasks(e.target.value)}
												placeholder="Search tasks to add as dependency..."
												className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
											/>
											{depSearchResults.length > 0 && (
												<div className="border border-border rounded-md overflow-hidden">
													{depSearchResults.map((t) => (
														<button
															key={t.id}
															className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center justify-between border-b border-border last:border-0"
															onClick={() => handleAddDependency(t.id)}
															disabled={addingDep}
														>
															<div className="flex items-center gap-2 min-w-0">
																<span
																	className={`w-2 h-2 rounded-full shrink-0 ${
																		t.status === "done" || t.status === "closed"
																			? "bg-green-500"
																			: t.status === "in_progress"
																				? "bg-blue-500"
																				: "bg-gray-400"
																	}`}
																/>
																<span className="truncate">{t.title}</span>
															</div>
															<span className="text-xs text-muted-foreground capitalize shrink-0 ml-2">
																{t.status.replace("_", " ")}
															</span>
														</button>
													))}
												</div>
											)}
											{depSearchQuery && depSearchResults.length === 0 && (
												<p className="text-xs text-muted-foreground px-1">
													No matching tasks found
												</p>
											)}
											<Button
												variant="ghost"
												size="sm"
												className="text-xs"
												onClick={() => {
													setShowDepSearch(false);
													setDepSearchQuery("");
													setDepSearchResults([]);
												}}
											>
												Cancel
											</Button>
										</div>
									)}
								</div>

								{/* Blocked by (this task depends on) */}
								{blockedBy.length > 0 && (
									<div>
										<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
											<svg
												width="12"
												height="12"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												className="text-red-500"
											>
												<circle cx="12" cy="12" r="10" />
												<line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
											</svg>
											Blocked By ({blockedBy.length})
										</h4>
										<div className="space-y-1.5">
											{blockedBy.map((dep) => (
												<div
													key={dep.id}
													className="flex items-center justify-between px-3 py-2 border border-border rounded-md group hover:border-red-200 dark:hover:border-red-900 transition-colors"
												>
													<div className="flex items-center gap-2 min-w-0">
														<span
															className={`w-2 h-2 rounded-full shrink-0 ${
																dep.dependsOnTask?.status === "done" ||
																dep.dependsOnTask?.status === "closed"
																	? "bg-green-500"
																	: "bg-red-500"
															}`}
														/>
														<span className="text-sm truncate">
															{dep.dependsOnTask?.title || "Unknown task"}
														</span>
														{(dep.dependsOnTask?.status === "done" ||
															dep.dependsOnTask?.status === "closed") && (
															<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0">
																Completed
															</span>
														)}
													</div>
													<Button
														variant="ghost"
														size="sm"
														className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
														onClick={() => handleRemoveDependency(dep.id)}
													>
														&times;
													</Button>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Blocking (other tasks depend on this) */}
								{blocking.length > 0 && (
									<div>
										<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
											<svg
												width="12"
												height="12"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												className="text-amber-500"
											>
												<path d="M12 9v4" />
												<path d="M12 17h.01" />
												<path d="M3.262 13.424a1.5 1.5 0 0 1 0-2.848l8.29-3.63a1.5 1.5 0 0 1 1.198 0l8.29 3.63a1.5 1.5 0 0 1 0 2.848l-8.29 3.63a1.5 1.5 0 0 1-1.198 0z" />
											</svg>
											Blocking ({blocking.length})
										</h4>
										<div className="space-y-1.5">
											{blocking.map((dep) => (
												<div
													key={dep.id}
													className="flex items-center justify-between px-3 py-2 border border-border rounded-md group hover:border-amber-200 dark:hover:border-amber-900 transition-colors"
												>
													<div className="flex items-center gap-2 min-w-0">
														<span
															className={`w-2 h-2 rounded-full shrink-0 ${
																dep.dependentTask?.status === "done" ||
																dep.dependentTask?.status === "closed"
																	? "bg-green-500"
																	: "bg-amber-500"
															}`}
														/>
														<span className="text-sm truncate">
															{dep.dependentTask?.title || "Unknown task"}
														</span>
														<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
															Waiting
														</span>
													</div>
													<Button
														variant="ghost"
														size="sm"
														className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
														onClick={() => handleRemoveDependency(dep.id)}
													>
														&times;
													</Button>
												</div>
											))}
										</div>
									</div>
								)}

								{blockedBy.length === 0 &&
									blocking.length === 0 &&
									!showDepSearch && (
										<div className="text-center py-6">
											<svg
												width="32"
												height="32"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="1.5"
												className="mx-auto text-muted-foreground/50 mb-2"
											>
												<path d="M9 6l6 6-6 6" />
												<path d="M4 12h12" />
												<circle cx="20" cy="12" r="2" />
											</svg>
											<p className="text-sm text-muted-foreground">
												No dependencies
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												Add dependencies to define task execution order
											</p>
										</div>
									)}

								{/* Dependency chain visualization */}
								{(blockedBy.length > 0 || blocking.length > 0) && (
									<div className="border-t border-border pt-3 mt-3">
										<h4 className="text-xs font-medium text-muted-foreground mb-2">
											Flow
										</h4>
										<div className="flex items-center gap-1 flex-wrap text-xs">
											{blockedBy.map((dep, i) => (
												<span key={dep.id} className="flex items-center gap-1">
													<span
														className={`px-2 py-1 rounded ${
															dep.dependsOnTask?.status === "done" ||
															dep.dependsOnTask?.status === "closed"
																? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 line-through"
																: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
														}`}
													>
														{dep.dependsOnTask?.title?.substring(0, 20) || "?"}
														{(dep.dependsOnTask?.title?.length || 0) > 20
															? "..."
															: ""}
													</span>
													<span className="text-muted-foreground">&rarr;</span>
												</span>
											))}
											<span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium">
												{task.title.substring(0, 20)}
												{task.title.length > 20 ? "..." : ""}
											</span>
											{blocking.map((dep) => (
												<span key={dep.id} className="flex items-center gap-1">
													<span className="text-muted-foreground">&rarr;</span>
													<span className="px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
														{dep.dependentTask?.title?.substring(0, 20) || "?"}
														{(dep.dependentTask?.title?.length || 0) > 20
															? "..."
															: ""}
													</span>
												</span>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</motion.div>
		</motion.div>
	);
}

// ===========================================================================
// ListView
// ===========================================================================

function ListView({
	tasks,
	categories,
	members,
	onTaskClick,
}: {
	tasks: Task[];
	categories: Category[];
	members: Member[];
	onTaskClick: (task: Task) => void;
}) {
	const [sortBy, setSortBy] = useState<
		"priority" | "status" | "dueAt" | "title" | "assignee"
	>("priority");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
	const [groupBy, setGroupBy] = useState<
		"none" | "status" | "priority" | "category" | "assignee"
	>("status");

	const priorityOrder: Record<string, number> = {
		urgent: 4,
		high: 3,
		medium: 2,
		low: 1,
		none: 0,
	};

	const sortedTasks = useMemo(() => {
		const sorted = [...tasks].sort((a, b) => {
			let cmp = 0;
			switch (sortBy) {
				case "priority":
					cmp =
						(priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
					break;
				case "status":
					cmp = a.status.localeCompare(b.status);
					break;
				case "dueAt":
					if (!a.dueAt && !b.dueAt) cmp = 0;
					else if (!a.dueAt) cmp = 1;
					else if (!b.dueAt) cmp = -1;
					else cmp = new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
					break;
				case "title":
					cmp = a.title.localeCompare(b.title);
					break;
				case "assignee":
					cmp = (a.assignee?.name || "zzz").localeCompare(
						b.assignee?.name || "zzz"
					);
					break;
			}
			return sortDir === "asc" ? cmp : -cmp;
		});
		return sorted;
	}, [tasks, sortBy, sortDir]);

	const categoryMap = useMemo(() => {
		const m: Record<string, Category> = {};
		for (const c of categories) m[c.id] = c;
		return m;
	}, [categories]);

	const grouped = useMemo(() => {
		if (groupBy === "none") return {"All Tasks": sortedTasks};
		const groups: Record<string, Task[]> = {};
		for (const task of sortedTasks) {
			let key = "";
			switch (groupBy) {
				case "status":
					key = statusLabels[task.status] || task.status;
					break;
				case "priority":
					key = priorityLabels[task.priority] || task.priority;
					break;
				case "category":
					key = task.categoryId
						? categoryMap[task.categoryId]?.name || "Unknown"
						: "Uncategorized";
					break;
				case "assignee":
					key = task.assignee?.name || "Unassigned";
					break;
			}
			if (!groups[key]) groups[key] = [];
			groups[key]!.push(task);
		}
		return groups;
	}, [sortedTasks, groupBy, categoryMap]);

	const handleSort = (field: typeof sortBy) => {
		if (sortBy === field) {
			setSortDir(sortDir === "asc" ? "desc" : "asc");
		} else {
			setSortBy(field);
			setSortDir(field === "title" ? "asc" : "desc");
		}
	};

	const SortIcon = ({field}: {field: typeof sortBy}) =>
		sortBy === field ? (
			<span className="ml-0.5 text-[10px]">
				{sortDir === "asc" ? "\u25B2" : "\u25BC"}
			</span>
		) : null;

	return (
		<div className="flex-1 overflow-auto">
			{/* Controls */}
			<div className="px-4 py-2 border-b border-border flex items-center gap-3">
				<span className="text-xs text-muted-foreground">Group by:</span>
				<select
					value={groupBy}
					onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
					className="text-xs border border-input rounded-md px-2 py-1 bg-background"
				>
					<option value="none">None</option>
					<option value="status">Status</option>
					<option value="priority">Priority</option>
					<option value="category">Category</option>
					<option value="assignee">Assignee</option>
				</select>
				<span className="text-xs text-muted-foreground ml-2">
					{tasks.length} tasks
				</span>
			</div>

			<div className="px-4">
				{/* Table header */}
				<div className="grid grid-cols-[1fr_100px_100px_110px_110px_100px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border sticky top-0 bg-background">
					<button
						className="text-left hover:text-foreground"
						onClick={() => handleSort("title")}
					>
						Title <SortIcon field="title" />
					</button>
					<button
						className="text-left hover:text-foreground"
						onClick={() => handleSort("status")}
					>
						Status <SortIcon field="status" />
					</button>
					<button
						className="text-left hover:text-foreground"
						onClick={() => handleSort("priority")}
					>
						Priority <SortIcon field="priority" />
					</button>
					<button
						className="text-left hover:text-foreground"
						onClick={() => handleSort("assignee")}
					>
						Assignee <SortIcon field="assignee" />
					</button>
					<button
						className="text-left hover:text-foreground"
						onClick={() => handleSort("dueAt")}
					>
						Due Date <SortIcon field="dueAt" />
					</button>
					<span>Category</span>
				</div>

				{/* Grouped rows */}
				{Object.entries(grouped).map(([groupName, groupTasks]) => (
					<div key={groupName}>
						{groupBy !== "none" && (
							<div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-3 border-b border-border bg-muted/30">
								{groupName} ({groupTasks.length})
							</div>
						)}
						{groupTasks.map((task) => {
							const isOverdue =
								task.dueAt &&
								new Date(task.dueAt) < new Date() &&
								task.status !== "done" &&
								task.status !== "closed";
							const cat = task.categoryId ? categoryMap[task.categoryId] : null;
							return (
								<div
									key={task.id}
									className="grid grid-cols-[1fr_100px_100px_110px_110px_100px] gap-2 px-3 py-2.5 border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors items-center"
									onClick={() => onTaskClick(task)}
								>
									<div className="flex items-center gap-2 min-w-0">
										<div
											className={`w-2 h-2 rounded-full shrink-0 ${priorityColors[task.priority] || "bg-gray-400"}`}
										/>
										<span className="text-sm truncate">{task.title}</span>
										{task.labels && task.labels.length > 0 && (
											<div className="flex gap-0.5 shrink-0">
												{task.labels.slice(0, 3).map((l) => (
													<div
														key={l.id}
														className="w-2 h-2 rounded-full"
														style={{backgroundColor: l.color}}
														title={l.name}
													/>
												))}
											</div>
										)}
									</div>
									<Badge
										variant="outline"
										className="text-[10px] h-5 px-1.5 w-fit"
									>
										{statusLabels[task.status] || task.status}
									</Badge>
									<span className="text-xs text-muted-foreground capitalize">
										{priorityLabels[task.priority] || task.priority}
									</span>
									<div className="flex items-center gap-1.5">
										{task.assignee ? (
											<>
												<Avatar className="h-5 w-5">
													<AvatarFallback className="text-[10px]">
														{task.assignee.name.charAt(0).toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<span className="text-xs truncate">
													{task.assignee.name}
												</span>
											</>
										) : (
											<span className="text-xs text-muted-foreground">-</span>
										)}
									</div>
									<span
										className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}
									>
										{task.dueAt
											? new Date(task.dueAt).toLocaleDateString("en", {
													month: "short",
													day: "numeric",
												})
											: "-"}
									</span>
									<div className="flex items-center gap-1.5">
										{cat && (
											<>
												<div
													className="w-2 h-2 rounded-full shrink-0"
													style={{backgroundColor: cat.color || "#6B7280"}}
												/>
												<span className="text-xs truncate">{cat.name}</span>
											</>
										)}
										{!cat && (
											<span className="text-xs text-muted-foreground">-</span>
										)}
									</div>
								</div>
							);
						})}
					</div>
				))}

				{tasks.length === 0 && (
					<div className="text-center py-16">
						<p className="text-sm text-muted-foreground">No tasks found</p>
					</div>
				)}
			</div>
		</div>
	);
}

// ===========================================================================
// CalendarView
// ===========================================================================

function CalendarView({
	tasks,
	onTaskClick,
}: {
	tasks: Task[];
	onTaskClick: (task: Task) => void;
}) {
	const [currentDate, setCurrentDate] = useState(() => new Date());
	const [calView, setCalView] = useState<"month" | "week">("month");

	const year = currentDate.getFullYear();
	const month = currentDate.getMonth();

	const navigate = (dir: -1 | 1) => {
		setCurrentDate((prev) => {
			const d = new Date(prev);
			if (calView === "month") {
				d.setMonth(d.getMonth() + dir);
			} else {
				d.setDate(d.getDate() + dir * 7);
			}
			return d;
		});
	};

	const goToday = () => setCurrentDate(new Date());

	// Build task map by date key (YYYY-MM-DD)
	const tasksByDate = useMemo(() => {
		const map: Record<string, Task[]> = {};
		for (const task of tasks) {
			if (task.dueAt) {
				const key = task.dueAt.split("T")[0]!;
				if (!map[key]) map[key] = [];
				map[key]!.push(task);
			}
		}
		return map;
	}, [tasks]);

	// Generate days for month view
	const monthDays = useMemo(() => {
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const startPad = firstDay.getDay(); // 0=Sun
		const days: {date: Date; isCurrentMonth: boolean}[] = [];

		// Pad start
		for (let i = startPad - 1; i >= 0; i--) {
			const d = new Date(year, month, -i);
			days.push({date: d, isCurrentMonth: false});
		}
		// Current month
		for (let i = 1; i <= lastDay.getDate(); i++) {
			days.push({date: new Date(year, month, i), isCurrentMonth: true});
		}
		// Pad end to fill 6 rows
		const remaining = 42 - days.length;
		for (let i = 1; i <= remaining; i++) {
			days.push({date: new Date(year, month + 1, i), isCurrentMonth: false});
		}
		return days;
	}, [year, month]);

	// Generate days for week view
	const weekDays = useMemo(() => {
		const d = new Date(currentDate);
		const day = d.getDay();
		d.setDate(d.getDate() - day); // Start of week (Sunday)
		const days: Date[] = [];
		for (let i = 0; i < 7; i++) {
			days.push(new Date(d));
			d.setDate(d.getDate() + 1);
		}
		return days;
	}, [currentDate]);

	const today = new Date();
	const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

	const formatDateKey = (d: Date) =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

	const monthLabel = currentDate.toLocaleDateString("en", {
		month: "long",
		year: "numeric",
	});
	const weekLabel = (() => {
		const start = weekDays[0]!;
		const end = weekDays[6]!;
		if (start.getMonth() === end.getMonth()) {
			return `${start.toLocaleDateString("en", {month: "long"})} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
		}
		return `${start.toLocaleDateString("en", {month: "short"})} ${start.getDate()} - ${end.toLocaleDateString("en", {month: "short"})} ${end.getDate()}, ${end.getFullYear()}`;
	})();

	const unscheduledTasks = tasks.filter((t) => !t.dueAt);

	return (
		<div className="flex-1 overflow-auto flex flex-col">
			{/* Calendar controls */}
			<div className="px-4 py-2 border-b border-border flex items-center justify-between shrink-0">
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="h-7 text-xs"
						onClick={() => navigate(-1)}
					>
						&larr;
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-7 text-xs"
						onClick={goToday}
					>
						Today
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-7 text-xs"
						onClick={() => navigate(1)}
					>
						&rarr;
					</Button>
					<span className="text-sm font-medium ml-2">
						{calView === "month" ? monthLabel : weekLabel}
					</span>
				</div>
				<div className="flex items-center bg-muted rounded-md p-0.5 gap-0.5">
					<button
						onClick={() => setCalView("week")}
						className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
							calView === "week"
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						Week
					</button>
					<button
						onClick={() => setCalView("month")}
						className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
							calView === "month"
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						Month
					</button>
				</div>
			</div>

			<div className="flex flex-1 overflow-hidden">
				{/* Calendar grid */}
				<div className="flex-1 flex flex-col overflow-auto">
					{/* Day headers */}
					<div className="grid grid-cols-7 border-b border-border shrink-0">
						{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
							<div
								key={d}
								className="px-2 py-1.5 text-xs font-medium text-muted-foreground text-center border-r border-border last:border-r-0"
							>
								{d}
							</div>
						))}
					</div>

					{calView === "month" ? (
						<div
							className="grid grid-cols-7 flex-1"
							style={{gridAutoRows: "minmax(90px, 1fr)"}}
						>
							{monthDays.map(({date, isCurrentMonth}, i) => {
								const key = formatDateKey(date);
								const dayTasks = tasksByDate[key] || [];
								const isToday = key === todayKey;
								return (
									<div
										key={i}
										className={`border-r border-b border-border last:border-r-0 p-1 ${
											!isCurrentMonth ? "bg-muted/20" : ""
										}`}
									>
										<div
											className={`text-xs font-medium mb-0.5 w-6 h-6 flex items-center justify-center rounded-full ${
												isToday
													? "bg-primary text-primary-foreground"
													: isCurrentMonth
														? "text-foreground"
														: "text-muted-foreground"
											}`}
										>
											{date.getDate()}
										</div>
										<div className="space-y-0.5 overflow-hidden">
											{dayTasks.slice(0, 3).map((task) => (
												<button
													key={task.id}
													onClick={() => onTaskClick(task)}
													className="w-full text-left px-1 py-0.5 text-[10px] leading-tight rounded truncate hover:bg-muted transition-colors flex items-center gap-1"
												>
													<span
														className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityColors[task.priority] || "bg-gray-400"}`}
													/>
													<span className="truncate">{task.title}</span>
												</button>
											))}
											{dayTasks.length > 3 && (
												<span className="text-[10px] text-muted-foreground px-1">
													+{dayTasks.length - 3} more
												</span>
											)}
										</div>
									</div>
								);
							})}
						</div>
					) : (
						/* Week view */
						<div
							className="grid grid-cols-7 flex-1"
							style={{minHeight: "400px"}}
						>
							{weekDays.map((date, i) => {
								const key = formatDateKey(date);
								const dayTasks = tasksByDate[key] || [];
								const isToday = key === todayKey;
								return (
									<div
										key={i}
										className="border-r border-border last:border-r-0 p-2 flex flex-col"
									>
										<div
											className={`text-sm font-medium mb-2 w-8 h-8 flex items-center justify-center rounded-full mx-auto ${
												isToday
													? "bg-primary text-primary-foreground"
													: "text-foreground"
											}`}
										>
											{date.getDate()}
										</div>
										<div className="space-y-1 flex-1 overflow-auto">
											{dayTasks.map((task) => (
												<Card
													key={task.id}
													className="cursor-pointer hover:shadow-md transition-shadow"
													onClick={() => onTaskClick(task)}
												>
													<CardContent className="p-2 space-y-1">
														<div className="flex items-center gap-1">
															<div
																className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityColors[task.priority] || "bg-gray-400"}`}
															/>
															<span className="text-xs font-medium truncate">
																{task.title}
															</span>
														</div>
														{task.assignee && (
															<div className="flex items-center gap-1">
																<Avatar className="h-4 w-4">
																	<AvatarFallback className="text-[8px]">
																		{task.assignee.name.charAt(0).toUpperCase()}
																	</AvatarFallback>
																</Avatar>
																<span className="text-[10px] text-muted-foreground truncate">
																	{task.assignee.name}
																</span>
															</div>
														)}
														<Badge
															variant="outline"
															className="text-[9px] h-4 px-1"
														>
															{statusLabels[task.status] || task.status}
														</Badge>
													</CardContent>
												</Card>
											))}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Unscheduled sidebar */}
				{unscheduledTasks.length > 0 && (
					<div className="w-52 border-l border-border shrink-0 flex flex-col">
						<div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
							No due date ({unscheduledTasks.length})
						</div>
						<ScrollArea className="flex-1">
							<div className="p-2 space-y-1.5">
								{unscheduledTasks.map((task) => (
									<button
										key={task.id}
										onClick={() => onTaskClick(task)}
										className="w-full text-left px-2 py-1.5 rounded border border-border hover:bg-muted/50 transition-colors"
									>
										<div className="flex items-center gap-1.5">
											<div
												className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityColors[task.priority] || "bg-gray-400"}`}
											/>
											<span className="text-xs truncate">{task.title}</span>
										</div>
									</button>
								))}
							</div>
						</ScrollArea>
					</div>
				)}
			</div>
		</div>
	);
}

// ===========================================================================
// TimelineView (Gantt Chart)
// ===========================================================================

const TIMELINE_DAY_WIDTH = 36;
const TIMELINE_ROW_HEIGHT = 40;

function TimelineView({
	tasks,
	categories,
	onTaskClick,
}: {
	tasks: Task[];
	categories: Category[];
	onTaskClick: (task: Task) => void;
}) {
	const [timelineRange, setTimelineRange] = useState<
		"2weeks" | "1month" | "3months"
	>("1month");
	const scrollRef = useRef<HTMLDivElement>(null);

	const categoryMap = useMemo(() => {
		const m: Record<string, Category> = {};
		for (const c of categories) m[c.id] = c;
		return m;
	}, [categories]);

	// Calculate date range
	const {startDate, endDate, totalDays, months} = useMemo(() => {
		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const end = new Date(start);

		switch (timelineRange) {
			case "2weeks":
				start.setDate(start.getDate() - 7);
				end.setDate(end.getDate() + 7);
				break;
			case "1month":
				start.setDate(start.getDate() - 7);
				end.setDate(end.getDate() + 24);
				break;
			case "3months":
				start.setDate(start.getDate() - 14);
				end.setDate(end.getDate() + 76);
				break;
		}

		const total = Math.ceil(
			(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
		);

		// Group days by month for header
		const monthGroups: {label: string; days: number; startIdx: number}[] = [];
		let prevMonth = -1;
		for (let i = 0; i < total; i++) {
			const d = new Date(start);
			d.setDate(d.getDate() + i);
			const m = d.getMonth();
			if (m !== prevMonth) {
				monthGroups.push({
					label: d.toLocaleDateString("en", {month: "short", year: "numeric"}),
					days: 1,
					startIdx: i,
				});
				prevMonth = m;
			} else {
				monthGroups[monthGroups.length - 1]!.days++;
			}
		}

		return {
			startDate: start,
			endDate: end,
			totalDays: total,
			months: monthGroups,
		};
	}, [timelineRange]);

	// Sort tasks: those with dates first, then by startAt/dueAt
	const sortedTasks = useMemo(() => {
		return [...tasks].sort((a, b) => {
			const aStart = a.startAt || a.dueAt || a.createdAt;
			const bStart = b.startAt || b.dueAt || b.createdAt;
			if (!aStart && !bStart) return 0;
			if (!aStart) return 1;
			if (!bStart) return -1;
			return new Date(aStart).getTime() - new Date(bStart).getTime();
		});
	}, [tasks]);

	// Helper: get pixel offset for a date
	const getDateOffset = (dateStr: string) => {
		const d = new Date(dateStr);
		const diff = (d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
		return diff * TIMELINE_DAY_WIDTH;
	};

	// Calculate today marker position
	const todayOffset = useMemo(() => {
		const now = new Date();
		const diff = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
		return diff * TIMELINE_DAY_WIDTH;
	}, [startDate]);

	// Scroll to today on mount
	useEffect(() => {
		if (scrollRef.current) {
			const scrollTo = todayOffset - scrollRef.current.clientWidth / 3;
			scrollRef.current.scrollLeft = Math.max(0, scrollTo);
		}
	}, [todayOffset]);

	// Generate day columns
	const days = useMemo(() => {
		const result: {
			date: Date;
			key: string;
			isWeekend: boolean;
			isToday: boolean;
		}[] = [];
		const today = new Date();
		const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
		for (let i = 0; i < totalDays; i++) {
			const d = new Date(startDate);
			d.setDate(d.getDate() + i);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
			result.push({
				date: d,
				key,
				isWeekend: d.getDay() === 0 || d.getDay() === 6,
				isToday: key === todayKey,
			});
		}
		return result;
	}, [startDate, totalDays]);

	const gridWidth = totalDays * TIMELINE_DAY_WIDTH;

	return (
		<div className="flex-1 flex flex-col overflow-hidden">
			{/* Controls */}
			<div className="px-4 py-2 border-b border-border flex items-center gap-3 shrink-0">
				<span className="text-xs text-muted-foreground">Range:</span>
				<div className="flex items-center bg-muted rounded-md p-0.5 gap-0.5">
					{(["2weeks", "1month", "3months"] as const).map((r) => (
						<button
							key={r}
							onClick={() => setTimelineRange(r)}
							className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
								timelineRange === r
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{r === "2weeks"
								? "2 Weeks"
								: r === "1month"
									? "1 Month"
									: "3 Months"}
						</button>
					))}
				</div>
				<span className="text-xs text-muted-foreground ml-2">
					{tasks.length} tasks
				</span>
			</div>

			<div className="flex-1 flex overflow-hidden">
				{/* Task names (fixed left panel) */}
				<div className="w-64 shrink-0 border-r border-border flex flex-col overflow-hidden">
					{/* Header spacer */}
					<div className="h-[52px] border-b border-border shrink-0 px-3 flex items-end pb-1">
						<span className="text-xs font-medium text-muted-foreground">
							Task
						</span>
					</div>
					{/* Task rows */}
					<div className="flex-1 overflow-y-auto overflow-x-hidden">
						{sortedTasks.map((task) => {
							const cat = task.categoryId ? categoryMap[task.categoryId] : null;
							return (
								<div
									key={task.id}
									className="flex items-center gap-2 px-3 border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
									style={{height: TIMELINE_ROW_HEIGHT}}
									onClick={() => onTaskClick(task)}
								>
									<div
										className={`w-2 h-2 rounded-full shrink-0 ${priorityColors[task.priority] || "bg-gray-400"}`}
									/>
									{cat && (
										<div
											className="w-1.5 h-1.5 rounded-full shrink-0"
											style={{backgroundColor: cat.color || "#6B7280"}}
										/>
									)}
									<span className="text-xs truncate flex-1">{task.title}</span>
									{task.assignee && (
										<Avatar className="h-4 w-4 shrink-0">
											<AvatarFallback className="text-[8px]">
												{task.assignee.name.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* Timeline grid (scrollable) */}
				<div ref={scrollRef} className="flex-1 overflow-auto">
					<div
						style={{width: gridWidth, minHeight: "100%"}}
						className="relative"
					>
						{/* Month headers */}
						<div className="flex h-6 border-b border-border sticky top-0 bg-background z-10">
							{months.map((m, i) => (
								<div
									key={i}
									className="text-[10px] font-medium text-muted-foreground px-1 border-r border-border flex items-center"
									style={{width: m.days * TIMELINE_DAY_WIDTH}}
								>
									{m.label}
								</div>
							))}
						</div>

						{/* Day headers */}
						<div className="flex h-[26px] border-b border-border sticky top-6 bg-background z-10">
							{days.map((d, i) => (
								<div
									key={i}
									className={`text-center text-[10px] border-r border-border/50 flex items-center justify-center ${
										d.isToday
											? "bg-primary/10 text-primary font-bold"
											: d.isWeekend
												? "bg-muted/30 text-muted-foreground"
												: "text-muted-foreground"
									}`}
									style={{width: TIMELINE_DAY_WIDTH}}
								>
									{d.date.getDate()}
								</div>
							))}
						</div>

						{/* Today marker */}
						<div
							className="absolute top-0 bottom-0 w-0.5 bg-primary/50 z-20 pointer-events-none"
							style={{left: todayOffset}}
						/>

						{/* Task bars */}
						<div className="relative">
							{/* Background grid stripes */}
							{days.map((d, i) => (
								<div
									key={i}
									className={`absolute top-0 bottom-0 border-r border-border/30 ${d.isWeekend ? "bg-muted/15" : ""}`}
									style={{
										left: i * TIMELINE_DAY_WIDTH,
										width: TIMELINE_DAY_WIDTH,
										height: sortedTasks.length * TIMELINE_ROW_HEIGHT || 400,
									}}
								/>
							))}

							{sortedTasks.map((task, rowIdx) => {
								const taskStart = task.startAt || task.dueAt;
								const taskEnd = task.dueAt || task.startAt;

								if (!taskStart && !taskEnd) {
									// No dates - show a diamond marker at current date position
									return (
										<div
											key={task.id}
											className="absolute flex items-center"
											style={{
												top: rowIdx * TIMELINE_ROW_HEIGHT,
												height: TIMELINE_ROW_HEIGHT,
											}}
										>
											<div
												className="absolute flex items-center justify-center cursor-pointer group"
												style={{left: todayOffset - 6}}
												onClick={() => onTaskClick(task)}
												title={`${task.title} (no dates set)`}
											>
												<div className="w-3 h-3 rotate-45 bg-muted-foreground/30 border border-muted-foreground/50 group-hover:bg-muted-foreground/50 transition-colors" />
											</div>
										</div>
									);
								}

								const barStart = getDateOffset(taskStart!);
								const barEnd = getDateOffset(taskEnd!);
								let barWidth = Math.max(
									barEnd - barStart,
									TIMELINE_DAY_WIDTH * 0.8
								);
								const barLeft = Math.min(barStart, barEnd);

								// Determine bar color
								const isDone =
									task.status === "done" || task.status === "closed";
								const isOverdue =
									task.dueAt && new Date(task.dueAt) < new Date() && !isDone;
								let barColor = "bg-primary/70";
								if (isDone) barColor = "bg-green-500/70";
								else if (isOverdue) barColor = "bg-red-500/70";
								else if (task.priority === "urgent") barColor = "bg-red-400/70";
								else if (task.priority === "high")
									barColor = "bg-orange-400/70";

								// Completion percentage (visual hint)
								const completionPct = isDone
									? 100
									: task.status === "review"
										? 80
										: task.status === "in_progress"
											? 40
											: 0;

								return (
									<div
										key={task.id}
										className="absolute flex items-center"
										style={{
											top: rowIdx * TIMELINE_ROW_HEIGHT,
											height: TIMELINE_ROW_HEIGHT,
										}}
									>
										<div
											className={`absolute h-6 rounded-md ${barColor} cursor-pointer hover:opacity-90 transition-opacity flex items-center overflow-hidden group`}
											style={{left: barLeft, width: barWidth, minWidth: 24}}
											onClick={() => onTaskClick(task)}
											title={`${task.title}${task.startAt ? "\nStart: " + new Date(task.startAt).toLocaleDateString() : ""}${task.dueAt ? "\nDue: " + new Date(task.dueAt).toLocaleDateString() : ""}`}
										>
											{/* Progress fill */}
											{completionPct > 0 && completionPct < 100 && (
												<div
													className="absolute inset-y-0 left-0 bg-white/20 rounded-l-md"
													style={{width: `${completionPct}%`}}
												/>
											)}
											<span className="text-[10px] text-white font-medium px-1.5 truncate relative z-10">
												{task.title}
											</span>
										</div>
										{/* Dependency arrows */}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			{/* Legend */}
			<div className="px-4 py-1.5 border-t border-border flex items-center gap-4 shrink-0 text-[10px] text-muted-foreground">
				<div className="flex items-center gap-1">
					<div className="w-3 h-2 rounded-sm bg-primary/70" /> In progress
				</div>
				<div className="flex items-center gap-1">
					<div className="w-3 h-2 rounded-sm bg-green-500/70" /> Done
				</div>
				<div className="flex items-center gap-1">
					<div className="w-3 h-2 rounded-sm bg-red-500/70" /> Overdue
				</div>
				<div className="flex items-center gap-1">
					<div className="w-3 h-2 rounded-sm bg-orange-400/70" /> High priority
				</div>
				<div className="flex items-center gap-1">
					<div className="w-3 h-3 rotate-45 bg-muted-foreground/30 border border-muted-foreground/50" />{" "}
					No dates
				</div>
			</div>
		</div>
	);
}
