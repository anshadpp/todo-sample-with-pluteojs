"use client";

import {useEffect, useState, useCallback, useRef, useMemo} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/lib/shadcn/ui/button";
import {Card, CardContent} from "@/components/lib/shadcn/ui/card";
import {Badge} from "@/components/lib/shadcn/ui/badge";
import {Avatar, AvatarFallback} from "@/components/lib/shadcn/ui/avatar";
import {ScrollArea} from "@/components/lib/shadcn/ui/scroll-area";
import {projectService, taskService} from "@/services/api/PluteoJS";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Task {
	id: string;
	projectId: string;
	title: string;
	description: string | null;
	priority: string;
	status: string;
	dueAt: string | null;
	startAt?: string | null;
	estimatedMinutes?: number | null;
	effortLevel?: string | null;
	completedAt?: string | null;
	assignee?: {id: string; name: string; image: string | null} | null;
	labels?: {id: string; name: string; color: string}[];
}

interface Project {
	id: string;
	name: string;
	color: string | null;
}

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
	open: "Open",
	in_progress: "In Progress",
	review: "Review",
	done: "Done",
	closed: "Closed",
};

const effortLabels: Record<string, string> = {
	low: "Low Effort",
	medium: "Medium Effort",
	high: "High Effort",
};

const effortColors: Record<string, string> = {
	low: "border-green-400 text-green-600 bg-green-50 dark:bg-green-500/10",
	medium:
		"border-yellow-400 text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10",
	high: "border-red-400 text-red-600 bg-red-50 dark:bg-red-500/10",
};

// Effort level to approximate minutes mapping (for smart suggestions)
const effortMinutes: Record<string, number> = {
	low: 15,
	medium: 45,
	high: 120,
};

// ---------------------------------------------------------------------------
// Pomodoro Timer Constants
// ---------------------------------------------------------------------------

const DEFAULT_WORK_MINUTES = 25;
const DEFAULT_SHORT_BREAK_MINUTES = 5;
const DEFAULT_LONG_BREAK_MINUTES = 15;
const POMODORO_SESSIONS_BEFORE_LONG = 4;

type TimerPhase = "work" | "short_break" | "long_break";

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

const API_BASE =
	process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3020";

async function apiFetch<T>(url: string): Promise<T | null> {
	try {
		const res = await fetch(`${API_BASE}${url}`, {
			credentials: "include",
			headers: {"Content-Type": "application/json"},
		});
		const json = await res.json();
		return json.data ?? null;
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// FocusPage
// ---------------------------------------------------------------------------

export default function FocusPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [todayTasks, setTodayTasks] = useState<Task[]>([]);
	const [projects, setProjects] = useState<Project[]>([]);
	const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

	// Pomodoro duration settings (in minutes)
	const [workMinutes, setWorkMinutes] = useState(DEFAULT_WORK_MINUTES);
	const [shortBreakMinutes, setShortBreakMinutes] = useState(
		DEFAULT_SHORT_BREAK_MINUTES
	);
	const [longBreakMinutes, setLongBreakMinutes] = useState(
		DEFAULT_LONG_BREAK_MINUTES
	);
	const [showTimerSettings, setShowTimerSettings] = useState(false);

	// Pomodoro state
	const [timerSeconds, setTimerSeconds] = useState(DEFAULT_WORK_MINUTES * 60);
	const [timerRunning, setTimerRunning] = useState(false);
	const [timerPhase, setTimerPhase] = useState<TimerPhase>("work");
	const [pomodoroCount, setPomodoroCount] = useState(0);
	const [totalWorkSeconds, setTotalWorkSeconds] = useState(0);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Focus task
	const [focusTaskId, setFocusTaskId] = useState<string | null>(null);

	// Smart suggestion
	const [freeMinutes, setFreeMinutes] = useState<number>(25);
	const [showSuggestion, setShowSuggestion] = useState(false);

	// Notifications blocked
	const [notificationsBlocked, setNotificationsBlocked] = useState(false);
	const originalTitle = useRef<string>("");

	// ---- Fetch today's tasks across all projects ---
	const fetchTodayTasks = useCallback(async () => {
		try {
			const orgId = localStorage.getItem("activeOrgId");
			const projResult = await projectService.getProjects(
				orgId && orgId !== "personal" ? orgId : null
			);

			if (!projResult.error && projResult.data) {
				const allProjects = projResult.data as unknown as Project[];
				setProjects(allProjects);

				const allTasks: Task[] = [];
				for (const project of allProjects) {
					const tasksResult = await taskService.getTasks(project.id);
					if (!tasksResult.error && tasksResult.data) {
						const tasks = tasksResult.data as unknown as Task[];
						allTasks.push(...tasks);
					}
				}

				// Filter to today's tasks
				const today = new Date();
				const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

				const todayFiltered = allTasks.filter((task) => {
					if (task.status === "done" || task.status === "closed") {
						// Show completed today tasks too
						if (task.dueAt && task.dueAt.startsWith(todayStr)) return true;
						return false;
					}
					// Tasks due today or overdue
					if (task.dueAt) {
						const dueDate = task.dueAt.split("T")[0]!;
						return dueDate <= todayStr;
					}
					// Tasks starting today
					if (task.startAt && task.startAt.startsWith(todayStr)) return true;
					return false;
				});

				// Sort: urgent first, then by priority, then overdue first
				const priorityOrder: Record<string, number> = {
					urgent: 0,
					high: 1,
					medium: 2,
					low: 3,
					none: 4,
				};
				todayFiltered.sort((a, b) => {
					// Done/closed last
					const aDone = a.status === "done" || a.status === "closed";
					const bDone = b.status === "done" || b.status === "closed";
					if (aDone && !bDone) return 1;
					if (!aDone && bDone) return -1;
					// Priority
					return (
						(priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
					);
				});

				setTodayTasks(todayFiltered);

				// Mark already completed ones
				const done = new Set<string>();
				for (const t of todayFiltered) {
					if (t.status === "done" || t.status === "closed") done.add(t.id);
				}
				setCompletedIds(done);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchTodayTasks();
	}, [fetchTodayTasks]);

	// ---- Pomodoro Timer ----
	useEffect(() => {
		if (timerRunning) {
			timerRef.current = setInterval(() => {
				setTimerSeconds((prev) => {
					if (prev <= 1) {
						// Timer finished
						setTimerRunning(false);
						handleTimerComplete();
						return 0;
					}
					if (timerPhase === "work") {
						setTotalWorkSeconds((s) => s + 1);
					}
					return prev - 1;
				});
			}, 1000);
		}
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [timerRunning, timerPhase]);

	const handleTimerComplete = useCallback(() => {
		// Play notification sound
		try {
			const ctx = new AudioContext();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.frequency.value = 800;
			gain.gain.value = 0.3;
			osc.start();
			osc.stop(ctx.currentTime + 0.3);
			setTimeout(() => {
				const osc2 = ctx.createOscillator();
				const gain2 = ctx.createGain();
				osc2.connect(gain2);
				gain2.connect(ctx.destination);
				osc2.frequency.value = 1000;
				gain2.gain.value = 0.3;
				osc2.start();
				osc2.stop(ctx.currentTime + 0.3);
			}, 350);
		} catch {
			/* audio not available */
		}

		if (timerPhase === "work") {
			const newCount = pomodoroCount + 1;
			setPomodoroCount(newCount);
			if (newCount % POMODORO_SESSIONS_BEFORE_LONG === 0) {
				setTimerPhase("long_break");
				setTimerSeconds(longBreakMinutes * 60);
			} else {
				setTimerPhase("short_break");
				setTimerSeconds(shortBreakMinutes * 60);
			}
		} else {
			setTimerPhase("work");
			setTimerSeconds(workMinutes * 60);
		}
	}, [
		timerPhase,
		pomodoroCount,
		workMinutes,
		shortBreakMinutes,
		longBreakMinutes,
	]);

	const toggleTimer = () => setTimerRunning(!timerRunning);

	const resetTimer = () => {
		setTimerRunning(false);
		setTimerPhase("work");
		setTimerSeconds(workMinutes * 60);
	};

	const skipPhase = () => {
		setTimerRunning(false);
		if (timerPhase === "work") {
			const newCount = pomodoroCount + 1;
			setPomodoroCount(newCount);
			if (newCount % POMODORO_SESSIONS_BEFORE_LONG === 0) {
				setTimerPhase("long_break");
				setTimerSeconds(longBreakMinutes * 60);
			} else {
				setTimerPhase("short_break");
				setTimerSeconds(shortBreakMinutes * 60);
			}
		} else {
			setTimerPhase("work");
			setTimerSeconds(workMinutes * 60);
		}
	};

	// ---- Task completion toggle ----
	const toggleTaskComplete = async (task: Task) => {
		const newStatus = completedIds.has(task.id) ? "open" : "done";
		const result = await taskService.updateTask(task.id, {status: newStatus});
		if (!result.error) {
			setCompletedIds((prev) => {
				const next = new Set(prev);
				if (newStatus === "done") {
					next.add(task.id);
				} else {
					next.delete(task.id);
				}
				return next;
			});
		}
	};

	// ---- Notification blocking ----
	useEffect(() => {
		originalTitle.current = document.title;
		return () => {
			document.title = originalTitle.current;
		};
	}, []);

	useEffect(() => {
		if (notificationsBlocked && timerRunning) {
			document.title = `Focus Mode - ${formatTime(timerSeconds)}`;
		} else if (!notificationsBlocked) {
			document.title = originalTitle.current;
		}
	}, [notificationsBlocked, timerRunning, timerSeconds]);

	// ---- Helpers ----
	const formatTime = (seconds: number) => {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
	};

	const projectMap = useMemo(() => {
		const m: Record<string, Project> = {};
		for (const p of projects) m[p.id] = p;
		return m;
	}, [projects]);

	// Smart suggestion: suggest tasks that fit available time
	const suggestedTasks = useMemo(() => {
		if (!showSuggestion || freeMinutes <= 0) return [];

		// Get incomplete tasks sorted by priority
		const incomplete = todayTasks.filter(
			(t) =>
				!completedIds.has(t.id) && t.status !== "done" && t.status !== "closed"
		);

		// Greedy fit: pick tasks that fit in available time
		let remaining = freeMinutes;
		const suggested: Task[] = [];

		for (const task of incomplete) {
			// Use estimatedMinutes if available, otherwise infer from effort level
			const mins = task.estimatedMinutes
				? task.estimatedMinutes
				: task.effortLevel
					? (effortMinutes[task.effortLevel] ?? 30)
					: 30; // default 30 min for tasks without effort

			if (mins <= remaining) {
				suggested.push(task);
				remaining -= mins;
			}
		}

		return suggested;
	}, [todayTasks, completedIds, freeMinutes, showSuggestion]);

	const totalTasks = todayTasks.length;
	const completedCount = completedIds.size;
	const progressPct =
		totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
	const focusTask = todayTasks.find((t) => t.id === focusTaskId) || null;

	// Timer ring progress
	const timerTotal =
		timerPhase === "work"
			? workMinutes * 60
			: timerPhase === "short_break"
				? shortBreakMinutes * 60
				: longBreakMinutes * 60;
	const timerPct =
		timerTotal > 0 ? ((timerTotal - timerSeconds) / timerTotal) * 100 : 0;
	const circumference = 2 * Math.PI * 90;
	const strokeDashoffset = circumference - (timerPct / 100) * circumference;

	// Phase colors
	const phaseColor =
		timerPhase === "work"
			? "text-primary"
			: timerPhase === "short_break"
				? "text-green-500"
				: "text-blue-500";
	const phaseStroke =
		timerPhase === "work"
			? "stroke-primary"
			: timerPhase === "short_break"
				? "stroke-green-500"
				: "stroke-blue-500";
	const phaseBg =
		timerPhase === "work"
			? "bg-primary/10"
			: timerPhase === "short_break"
				? "bg-green-500/10"
				: "bg-blue-500/10";
	const phaseLabel =
		timerPhase === "work"
			? "Work Session"
			: timerPhase === "short_break"
				? "Short Break"
				: "Long Break";

	if (loading) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-center space-y-3">
					<div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto" />
					<p className="text-sm text-muted-foreground">
						Entering focus mode...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col bg-background">
			{/* Focus Mode Header */}
			<div className="px-6 py-3 border-b border-border flex items-center justify-between shrink-0">
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.push("/dashboard")}
						className="gap-1.5"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M19 12H5M12 19l-7-7 7-7" />
						</svg>
						Exit Focus
					</Button>
					<div className="h-5 w-px bg-border" />
					<h1 className="text-lg font-semibold flex items-center gap-2">
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-primary"
						>
							<circle cx="12" cy="12" r="10" />
							<circle cx="12" cy="12" r="6" />
							<circle cx="12" cy="12" r="2" />
						</svg>
						Focus Mode
					</h1>
				</div>

				<div className="flex items-center gap-3">
					{/* Notification blocker toggle */}
					<button
						onClick={() => setNotificationsBlocked(!notificationsBlocked)}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
							notificationsBlocked
								? "bg-red-500/10 text-red-500 border border-red-500/20"
								: "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
						}`}
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
							{notificationsBlocked ? (
								<>
									<path d="M18.36 6.64A9 9 0 0 1 20.77 15" />
									<path d="M6.16 6.16a9 9 0 0 0 12.68 12.68" />
									<path d="M13.73 21a2 2 0 0 1-3.46 0" />
									<path d="M2 2l20 20" />
								</>
							) : (
								<>
									<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
									<path d="M13.73 21a2 2 0 0 1-3.46 0" />
								</>
							)}
						</svg>
						{notificationsBlocked
							? "Notifications Blocked"
							: "Block Notifications"}
					</button>

					{/* Pomodoro count */}
					<Badge variant="outline" className="gap-1 text-xs">
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<circle cx="12" cy="12" r="10" />
							<polyline points="12 6 12 12 16 14" />
						</svg>
						{pomodoroCount} pomodoros
					</Badge>

					{/* Total work time */}
					<Badge variant="outline" className="text-xs">
						{Math.floor(totalWorkSeconds / 60)}m focused
					</Badge>
				</div>
			</div>

			{/* Main content */}
			<div className="flex-1 flex overflow-hidden">
				{/* Left: Task list */}
				<div className="w-96 border-r border-border flex flex-col shrink-0">
					{/* Progress header */}
					<div className="px-4 py-3 border-b border-border">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium">Today&apos;s Tasks</span>
							<span className="text-xs text-muted-foreground">
								{completedCount}/{totalTasks} done
							</span>
						</div>
						{/* Progress bar */}
						<div className="h-2 bg-muted rounded-full overflow-hidden">
							<div
								className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
								style={{width: `${progressPct}%`}}
							/>
						</div>
						<div className="flex items-center justify-between mt-1.5">
							<span className="text-[10px] text-muted-foreground">
								{progressPct}% complete
							</span>
							{progressPct === 100 && totalTasks > 0 && (
								<span className="text-[10px] text-green-500 font-medium">
									All done!
								</span>
							)}
						</div>
					</div>

					{/* Smart Suggestion */}
					<div className="px-4 py-3 border-b border-border">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium flex items-center gap-1.5">
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="text-amber-500"
								>
									<path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
								</svg>
								Smart Suggest
							</span>
							<button
								onClick={() => setShowSuggestion(!showSuggestion)}
								className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
									showSuggestion
										? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
										: "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
								}`}
							>
								{showSuggestion ? "On" : "Off"}
							</button>
						</div>

						{showSuggestion && (
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<span className="text-xs text-muted-foreground whitespace-nowrap">
										I have
									</span>
									<input
										type="number"
										min={5}
										max={480}
										step={5}
										value={freeMinutes}
										onChange={(e) =>
											setFreeMinutes(Math.max(5, parseInt(e.target.value) || 5))
										}
										className="w-16 text-sm text-center border border-input rounded-md px-1.5 py-1 bg-background font-medium"
									/>
									<span className="text-xs text-muted-foreground whitespace-nowrap">
										min free
									</span>
								</div>

								{suggestedTasks.length > 0 ? (
									<div className="rounded-lg bg-amber-500/5 border border-amber-500/15 p-2.5">
										<p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 mb-1.5">
											You have {freeMinutes} minutes — do these tasks:
										</p>
										{suggestedTasks.map((task) => {
											const mins = task.estimatedMinutes
												? task.estimatedMinutes
												: task.effortLevel
													? (effortMinutes[task.effortLevel] ?? 30)
													: 30;
											return (
												<div
													key={task.id}
													className="flex items-center gap-2 py-1 cursor-pointer hover:bg-amber-500/10 rounded px-1 -mx-1 transition-colors"
													onClick={() => setFocusTaskId(task.id)}
												>
													<span
														className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityColors[task.priority] || "bg-gray-400"}`}
													/>
													<span className="text-xs flex-1 truncate">
														{task.title}
													</span>
													<span className="text-[10px] text-muted-foreground shrink-0">
														~{mins}m
													</span>
												</div>
											);
										})}
										<p className="text-[10px] text-muted-foreground mt-1.5 border-t border-amber-500/10 pt-1.5">
											Total: ~
											{suggestedTasks.reduce((sum, t) => {
												const mins = t.estimatedMinutes
													? t.estimatedMinutes
													: t.effortLevel
														? (effortMinutes[t.effortLevel] ?? 30)
														: 30;
												return sum + mins;
											}, 0)}{" "}
											min
										</p>
									</div>
								) : (
									<p className="text-[11px] text-muted-foreground">
										{todayTasks.filter((t) => !completedIds.has(t.id))
											.length === 0
											? "All tasks complete!"
											: "No tasks fit in the available time. Try adding more minutes."}
									</p>
								)}
							</div>
						)}
					</div>

					{/* Task list */}
					<ScrollArea className="flex-1">
						<div className="p-2 space-y-1">
							{todayTasks.length === 0 && (
								<div className="text-center py-12">
									<svg
										width="40"
										height="40"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.5"
										className="mx-auto text-muted-foreground/40 mb-3"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
										<polyline points="22 4 12 14.01 9 11.01" />
									</svg>
									<p className="text-sm text-muted-foreground">
										No tasks due today
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										Enjoy your free time!
									</p>
								</div>
							)}
							{todayTasks.map((task) => {
								const isCompleted = completedIds.has(task.id);
								const isFocused = focusTaskId === task.id;
								const proj = projectMap[task.projectId];
								const isOverdue =
									task.dueAt &&
									task.dueAt.split("T")[0]! <
										new Date().toISOString().split("T")[0]!;
								return (
									<div
										key={task.id}
										className={`flex items-start gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
											isFocused
												? "bg-primary/10 border border-primary/20 shadow-sm"
												: "hover:bg-muted/50 border border-transparent"
										} ${isCompleted ? "opacity-60" : ""}`}
										onClick={() => setFocusTaskId(isFocused ? null : task.id)}
									>
										{/* Checkbox */}
										<button
											className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
												isCompleted
													? "bg-green-500 border-green-500 text-white"
													: "border-muted-foreground/30 hover:border-primary"
											}`}
											onClick={(e) => {
												e.stopPropagation();
												toggleTaskComplete(task);
											}}
										>
											{isCompleted && (
												<svg
													width="10"
													height="10"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="3"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<polyline points="20 6 9 17 4 12" />
												</svg>
											)}
										</button>

										{/* Task content */}
										<div className="flex-1 min-w-0">
											<p
												className={`text-sm font-medium leading-tight ${isCompleted ? "line-through text-muted-foreground" : ""}`}
											>
												{task.title}
											</p>
											<div className="flex items-center gap-2 mt-1 flex-wrap">
												{proj && (
													<span className="flex items-center gap-1 text-[10px] text-muted-foreground">
														<span
															className="w-2 h-2 rounded-sm"
															style={{backgroundColor: proj.color || "#6B7280"}}
														/>
														{proj.name}
													</span>
												)}
												<span
													className={`flex items-center gap-1 text-[10px] ${isOverdue && !isCompleted ? "text-red-500 font-medium" : "text-muted-foreground"}`}
												>
													<span
														className={`w-1.5 h-1.5 rounded-full ${priorityColors[task.priority] || "bg-gray-400"}`}
													/>
													{priorityLabels[task.priority]}
												</span>
												{task.effortLevel && (
													<span
														className={`text-[10px] px-1.5 py-0 rounded-full border ${effortColors[task.effortLevel] || ""}`}
													>
														{effortLabels[task.effortLevel]}
													</span>
												)}
												{isOverdue && !isCompleted && (
													<span className="text-[10px] text-red-500 font-medium">
														Overdue
													</span>
												)}
												{task.status !== "open" &&
													task.status !== "done" &&
													task.status !== "closed" && (
														<Badge
															variant="outline"
															className="text-[9px] h-4 px-1"
														>
															{statusLabels[task.status]}
														</Badge>
													)}
											</div>
										</div>

										{/* Focus indicator */}
										{isFocused && (
											<div className="shrink-0 mt-1">
												<div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
											</div>
										)}
									</div>
								);
							})}
						</div>
					</ScrollArea>
				</div>

				{/* Center: Timer + Focus */}
				<div className="flex-1 flex flex-col items-center justify-center p-8">
					{/* Current focus task */}
					{focusTask && (
						<div
							className={`mb-8 px-6 py-3 rounded-xl ${phaseBg} border border-border max-w-md text-center`}
						>
							<p className="text-xs text-muted-foreground mb-1">
								Currently focusing on
							</p>
							<p className="text-base font-semibold">{focusTask.title}</p>
							{focusTask.description && (
								<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
									{focusTask.description}
								</p>
							)}
						</div>
					)}

					{/* Timer ring */}
					<div className="relative w-56 h-56 mb-6">
						<svg className="w-56 h-56 -rotate-90" viewBox="0 0 200 200">
							{/* Background ring */}
							<circle
								cx="100"
								cy="100"
								r="90"
								fill="none"
								strokeWidth="6"
								className="stroke-muted"
							/>
							{/* Progress ring */}
							<circle
								cx="100"
								cy="100"
								r="90"
								fill="none"
								strokeWidth="6"
								className={phaseStroke}
								strokeLinecap="round"
								strokeDasharray={circumference}
								strokeDashoffset={strokeDashoffset}
								style={{transition: "stroke-dashoffset 1s linear"}}
							/>
						</svg>
						{/* Timer text */}
						<div className="absolute inset-0 flex flex-col items-center justify-center">
							<span className={`text-4xl font-mono font-bold ${phaseColor}`}>
								{formatTime(timerSeconds)}
							</span>
							<span className="text-xs text-muted-foreground mt-1">
								{phaseLabel}
							</span>
						</div>
					</div>

					{/* Timer controls */}
					<div className="flex items-center gap-3 mb-8">
						<Button
							variant="outline"
							size="sm"
							onClick={resetTimer}
							className="h-9 px-3"
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
								<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
								<path d="M3 3v5h5" />
							</svg>
						</Button>
						<Button
							onClick={toggleTimer}
							size="lg"
							className={`h-12 px-8 rounded-full text-base font-medium ${
								timerRunning ? "bg-red-500 hover:bg-red-600 text-white" : ""
							}`}
						>
							{timerRunning ? (
								<>
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="currentColor"
										className="mr-2"
									>
										<rect x="6" y="4" width="4" height="16" />
										<rect x="14" y="4" width="4" height="16" />
									</svg>
									Pause
								</>
							) : (
								<>
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="currentColor"
										className="mr-2"
									>
										<polygon points="5 3 19 12 5 21" />
									</svg>
									{timerSeconds === timerTotal ? "Start" : "Resume"}
								</>
							)}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={skipPhase}
							className="h-9 px-3"
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
								<polygon points="5 4 15 12 5 20" />
								<line x1="19" y1="5" x2="19" y2="19" />
							</svg>
						</Button>
					</div>

					{/* Session dots */}
					<div className="flex items-center gap-2 mb-4">
						{Array.from({length: POMODORO_SESSIONS_BEFORE_LONG}).map((_, i) => (
							<div
								key={i}
								className={`w-3 h-3 rounded-full transition-colors ${
									i < pomodoroCount % POMODORO_SESSIONS_BEFORE_LONG
										? "bg-primary"
										: "bg-muted"
								}`}
							/>
						))}
					</div>

					{/* Timer settings toggle */}
					<button
						onClick={() => setShowTimerSettings(!showTimerSettings)}
						className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
					>
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="12" cy="12" r="3" />
							<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
						</svg>
						Timer Settings
						<svg
							width="10"
							height="10"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className={`transition-transform ${showTimerSettings ? "rotate-180" : ""}`}
						>
							<polyline points="6 9 12 15 18 9" />
						</svg>
					</button>

					{showTimerSettings && (
						<div className="flex items-center gap-4 mb-6 p-3 rounded-lg border border-border bg-muted/30">
							<div className="text-center">
								<label className="text-[10px] text-muted-foreground block mb-1">
									Work
								</label>
								<input
									type="number"
									min={1}
									max={120}
									value={workMinutes}
									onChange={(e) => {
										const val = Math.max(
											1,
											Math.min(120, parseInt(e.target.value) || 1)
										);
										setWorkMinutes(val);
										if (timerPhase === "work" && !timerRunning) {
											setTimerSeconds(val * 60);
										}
									}}
									className="w-14 text-sm text-center border border-input rounded-md px-1 py-1 bg-background font-medium"
								/>
								<span className="text-[10px] text-muted-foreground block mt-0.5">
									min
								</span>
							</div>
							<div className="text-center">
								<label className="text-[10px] text-muted-foreground block mb-1">
									Short Break
								</label>
								<input
									type="number"
									min={1}
									max={60}
									value={shortBreakMinutes}
									onChange={(e) => {
										const val = Math.max(
											1,
											Math.min(60, parseInt(e.target.value) || 1)
										);
										setShortBreakMinutes(val);
										if (timerPhase === "short_break" && !timerRunning) {
											setTimerSeconds(val * 60);
										}
									}}
									className="w-14 text-sm text-center border border-input rounded-md px-1 py-1 bg-background font-medium"
								/>
								<span className="text-[10px] text-muted-foreground block mt-0.5">
									min
								</span>
							</div>
							<div className="text-center">
								<label className="text-[10px] text-muted-foreground block mb-1">
									Long Break
								</label>
								<input
									type="number"
									min={1}
									max={60}
									value={longBreakMinutes}
									onChange={(e) => {
										const val = Math.max(
											1,
											Math.min(60, parseInt(e.target.value) || 1)
										);
										setLongBreakMinutes(val);
										if (timerPhase === "long_break" && !timerRunning) {
											setTimerSeconds(val * 60);
										}
									}}
									className="w-14 text-sm text-center border border-input rounded-md px-1 py-1 bg-background font-medium"
								/>
								<span className="text-[10px] text-muted-foreground block mt-0.5">
									min
								</span>
							</div>
						</div>
					)}

					{!focusTask && todayTasks.length > 0 && (
						<p className="text-sm text-muted-foreground">
							Select a task from the list to focus on
						</p>
					)}

					{!focusTask && todayTasks.length === 0 && (
						<div className="text-center">
							<p className="text-lg font-medium mb-1">Nothing due today</p>
							<p className="text-sm text-muted-foreground">
								Use the timer for free focus sessions
							</p>
						</div>
					)}
				</div>

				{/* Right: Stats panel */}
				<div className="w-72 border-l border-border flex flex-col shrink-0">
					<div className="px-4 py-3 border-b border-border">
						<h3 className="text-sm font-medium">Session Stats</h3>
					</div>
					<div className="p-4 space-y-4 flex-1">
						{/* Progress ring */}
						<Card>
							<CardContent className="p-4 text-center">
								<div className="relative w-24 h-24 mx-auto mb-3">
									<svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
										<circle
											cx="50"
											cy="50"
											r="42"
											fill="none"
											strokeWidth="6"
											className="stroke-muted"
										/>
										<circle
											cx="50"
											cy="50"
											r="42"
											fill="none"
											strokeWidth="6"
											className="stroke-green-500"
											strokeLinecap="round"
											strokeDasharray={2 * Math.PI * 42}
											strokeDashoffset={
												2 * Math.PI * 42 -
												(progressPct / 100) * 2 * Math.PI * 42
											}
											style={{transition: "stroke-dashoffset 0.5s ease"}}
										/>
									</svg>
									<div className="absolute inset-0 flex items-center justify-center">
										<span className="text-xl font-bold">{progressPct}%</span>
									</div>
								</div>
								<p className="text-xs text-muted-foreground">
									{completedCount} of {totalTasks} tasks complete
								</p>
							</CardContent>
						</Card>

						{/* Stats cards */}
						<div className="grid grid-cols-2 gap-2">
							<Card>
								<CardContent className="p-3 text-center">
									<p className="text-2xl font-bold text-primary">
										{pomodoroCount}
									</p>
									<p className="text-[10px] text-muted-foreground mt-0.5">
										Pomodoros
									</p>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="p-3 text-center">
									<p className="text-2xl font-bold text-primary">
										{Math.floor(totalWorkSeconds / 60)}
									</p>
									<p className="text-[10px] text-muted-foreground mt-0.5">
										Minutes
									</p>
								</CardContent>
							</Card>
						</div>

						{/* Task breakdown by priority */}
						<Card>
							<CardContent className="p-3">
								<p className="text-xs font-medium mb-2">By Priority</p>
								{(["urgent", "high", "medium", "low", "none"] as const).map(
									(p) => {
										const count = todayTasks.filter(
											(t) => t.priority === p
										).length;
										const done = todayTasks.filter(
											(t) => t.priority === p && completedIds.has(t.id)
										).length;
										if (count === 0) return null;
										return (
											<div
												key={p}
												className="flex items-center gap-2 mb-1.5 last:mb-0"
											>
												<span
													className={`w-2 h-2 rounded-full ${priorityColors[p]}`}
												/>
												<span className="text-xs flex-1">
													{priorityLabels[p]}
												</span>
												<span className="text-[10px] text-muted-foreground">
													{done}/{count}
												</span>
											</div>
										);
									}
								)}
							</CardContent>
						</Card>

						{/* Effort breakdown */}
						<Card>
							<CardContent className="p-3">
								<p className="text-xs font-medium mb-2">By Effort</p>
								{(["low", "medium", "high"] as const).map((e) => {
									const count = todayTasks.filter(
										(t) => t.effortLevel === e
									).length;
									const done = todayTasks.filter(
										(t) => t.effortLevel === e && completedIds.has(t.id)
									).length;
									if (count === 0) return null;
									return (
										<div
											key={e}
											className="flex items-center gap-2 mb-1.5 last:mb-0"
										>
											<span
												className={`w-2 h-2 rounded-full ${
													e === "low"
														? "bg-green-500"
														: e === "medium"
															? "bg-yellow-500"
															: "bg-red-500"
												}`}
											/>
											<span className="text-xs flex-1">{effortLabels[e]}</span>
											<span className="text-[10px] text-muted-foreground">
												{done}/{count}
											</span>
										</div>
									);
								})}
								{todayTasks.filter((t) => !t.effortLevel).length > 0 && (
									<div className="flex items-center gap-2 mb-1.5 last:mb-0">
										<span className="w-2 h-2 rounded-full bg-gray-400" />
										<span className="text-xs flex-1">Not set</span>
										<span className="text-[10px] text-muted-foreground">
											{
												todayTasks.filter(
													(t) => !t.effortLevel && completedIds.has(t.id)
												).length
											}
											/{todayTasks.filter((t) => !t.effortLevel).length}
										</span>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Project breakdown */}
						{projects.length > 0 && (
							<Card>
								<CardContent className="p-3">
									<p className="text-xs font-medium mb-2">By Project</p>
									{projects.map((proj) => {
										const count = todayTasks.filter(
											(t) => t.projectId === proj.id
										).length;
										if (count === 0) return null;
										const done = todayTasks.filter(
											(t) => t.projectId === proj.id && completedIds.has(t.id)
										).length;
										return (
											<div
												key={proj.id}
												className="flex items-center gap-2 mb-1.5 last:mb-0"
											>
												<span
													className="w-2 h-2 rounded-sm"
													style={{backgroundColor: proj.color || "#6B7280"}}
												/>
												<span className="text-xs flex-1 truncate">
													{proj.name}
												</span>
												<span className="text-[10px] text-muted-foreground">
													{done}/{count}
												</span>
											</div>
										);
									})}
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
