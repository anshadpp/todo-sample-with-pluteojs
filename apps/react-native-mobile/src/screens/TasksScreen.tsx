import React, {useEffect, useState, useCallback} from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	RefreshControl,
	TextInput,
	Alert,
	ActivityIndicator,
} from "react-native";
import * as Crypto from "expo-crypto";
import {useAuth} from "../context/AuthContext";
import {useNetwork} from "../context/NetworkContext";
import {apiFetch} from "../services/api";
import {
	getCachedTasks,
	setCachedTasks,
	addLocalTask,
	removeLocalTask,
	type LocalTask,
} from "../services/storage";
import {addToSyncQueue} from "../services/offlineSync";
import NetworkBadge from "../components/NetworkBadge";

const priorityColors: Record<string, string> = {
	urgent: "#EF4444",
	high: "#F97316",
	medium: "#EAB308",
	low: "#3B82F6",
	none: "#6B7280",
};

const effortColors: Record<string, string> = {
	low: "#22C55E",
	medium: "#EAB308",
	high: "#EF4444",
};

const statusIcons: Record<string, string> = {
	open: "○",
	in_progress: "◐",
	review: "◑",
	done: "●",
	closed: "✕",
};

export default function TasksScreen({
	route,
	navigation,
}: {
	route: any;
	navigation: any;
}) {
	const {projectId, projectName} = route.params;
	const {isLoggedIn} = useAuth();
	const {isConnected, pendingSync} = useNetwork();
	const [tasks, setTasks] = useState<LocalTask[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [showCreate, setShowCreate] = useState(false);
	const [newTitle, setNewTitle] = useState("");
	const [newPriority, setNewPriority] = useState("none");
	const [newEffort, setNewEffort] = useState("");
	const [creating, setCreating] = useState(false);
	const [filterStatus, setFilterStatus] = useState("all");

	const fetchTasks = useCallback(async () => {
		if (isConnected && isLoggedIn) {
			const res = await apiFetch<LocalTask[]>(
				`/api/v1/projects/${projectId}/tasks/`
			);
			if (res.isSuccess && res.data) {
				// Merge: keep local-only tasks, update server ones
				const cached = await getCachedTasks(projectId);
				const localOnly = cached.filter((t) => t.isLocal);
				const merged = [...res.data, ...localOnly];
				setTasks(merged);
				await setCachedTasks(projectId, merged);
			} else {
				const cached = await getCachedTasks(projectId);
				setTasks(cached);
			}
		} else {
			const cached = await getCachedTasks(projectId);
			setTasks(cached);
		}
		setLoading(false);
	}, [isConnected, isLoggedIn, projectId]);

	useEffect(() => {
		fetchTasks();
	}, [fetchTasks]);

	// Refresh when navigating back
	useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			fetchTasks();
		});
		return unsubscribe;
	}, [navigation, fetchTasks]);

	const onRefresh = async () => {
		setRefreshing(true);
		await fetchTasks();
		setRefreshing(false);
	};

	const handleCreateTask = async () => {
		if (!newTitle.trim()) return;
		setCreating(true);

		const payload: Record<string, unknown> = {
			title: newTitle.trim(),
			priority: newPriority,
			status: "open",
		};
		if (newEffort) payload.effortLevel = newEffort;

		if (isConnected && isLoggedIn) {
			// Try server-side create
			const res = await apiFetch<LocalTask>(
				`/api/v1/projects/${projectId}/tasks/`,
				{
					method: "POST",
					body: JSON.stringify(payload),
				}
			);
			if (res.isSuccess && res.data) {
				setTasks((prev) => [res.data!, ...prev]);
				const all = await getCachedTasks(projectId);
				all.unshift(res.data);
				await setCachedTasks(projectId, all);
			} else {
				Alert.alert("Error", "Could not create task on server, saved locally");
				// Fall through to local create
				await createLocally();
			}
		} else {
			// ── LOCAL CREATE (offline or no account) ─────────────
			await createLocally();
		}

		async function createLocally() {
			const localId = Crypto.randomUUID();
			const now = new Date().toISOString();
			const localTask: LocalTask = {
				id: localId,
				projectId,
				categoryId: null,
				assigneeId: null,
				title: newTitle.trim(),
				description: null,
				priority: newPriority,
				status: "open",
				sortOrder: 0,
				dueAt: null,
				startAt: null,
				estimatedMinutes: null,
				effortLevel: newEffort || null,
				createdAt: now,
				updatedAt: now,
				isLocal: true,
			};
			await addLocalTask(projectId, localTask);
			setTasks((prev) => [localTask, ...prev]);

			await addToSyncQueue({
				type: "create_task",
				projectId,
				categoryId: "",
				localId,
				payload,
			});
		}

		setNewTitle("");
		setNewPriority("none");
		setNewEffort("");
		setShowCreate(false);
		setCreating(false);
	};

	const handleDeleteTask = async (taskId: string, isLocal?: boolean) => {
		Alert.alert("Delete Task", "Are you sure?", [
			{text: "Cancel", style: "cancel"},
			{
				text: "Delete",
				style: "destructive",
				onPress: async () => {
					setTasks((prev) => prev.filter((t) => t.id !== taskId));
					await removeLocalTask(projectId, taskId);

					if (!isLocal && isConnected && isLoggedIn) {
						await apiFetch(`/api/v1/tasks/${taskId}`, {method: "DELETE"});
					} else if (!isLocal) {
						await addToSyncQueue({type: "delete_task", taskId, projectId});
					}
				},
			},
		]);
	};

	const filteredTasks =
		filterStatus === "all"
			? tasks
			: tasks.filter((t) => t.status === filterStatus);

	const renderTask = ({item}: {item: LocalTask}) => (
		<TouchableOpacity
			style={styles.taskCard}
			onPress={() =>
				navigation.navigate("TaskDetail", {
					taskId: item.id,
					projectId,
					isLocal: item.isLocal,
				})
			}
			onLongPress={() => handleDeleteTask(item.id, item.isLocal)}
			activeOpacity={0.7}
		>
			<View style={styles.taskLeft}>
				<Text
					style={[
						styles.statusIcon,
						{color: item.status === "done" ? "#22C55E" : "#94A3B8"},
					]}
				>
					{statusIcons[item.status] || "○"}
				</Text>
				<View style={styles.taskContent}>
					<View style={styles.taskTitleRow}>
						<Text
							style={[
								styles.taskTitle,
								item.status === "done" && styles.taskDone,
							]}
							numberOfLines={2}
						>
							{item.title}
						</Text>
						{item.isLocal && (
							<View style={styles.localBadge}>
								<Text style={styles.localBadgeText}>offline</Text>
							</View>
						)}
					</View>
					<View style={styles.taskMeta}>
						<View
							style={[
								styles.priorityDot,
								{backgroundColor: priorityColors[item.priority] || "#6B7280"},
							]}
						/>
						<Text style={styles.metaText}>{item.priority}</Text>
						{item.effortLevel && (
							<>
								<View
									style={[
										styles.effortDot,
										{
											backgroundColor:
												effortColors[item.effortLevel] || "#6B7280",
										},
									]}
								/>
								<Text style={styles.metaText}>{item.effortLevel} effort</Text>
							</>
						)}
						{item.dueAt && (
							<Text
								style={[
									styles.metaText,
									new Date(item.dueAt) < new Date() &&
										item.status !== "done" && {color: "#EF4444"},
								]}
							>
								Due{" "}
								{new Date(item.dueAt).toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								})}
							</Text>
						)}
					</View>
				</View>
			</View>
		</TouchableOpacity>
	);

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<TouchableOpacity onPress={() => navigation.goBack()}>
						<Text style={styles.backBtn}>‹ Back</Text>
					</TouchableOpacity>
					<Text style={styles.headerTitle} numberOfLines={1}>
						{projectName}
					</Text>
				</View>
				<View style={styles.headerRight}>
					<NetworkBadge />
					{pendingSync > 0 && (
						<Text style={styles.pendingText}>{pendingSync}</Text>
					)}
				</View>
			</View>

			{/* Status filter */}
			<View style={styles.filterRow}>
				{["all", "open", "in_progress", "review", "done"].map((s) => (
					<TouchableOpacity
						key={s}
						style={[
							styles.filterBtn,
							filterStatus === s && styles.filterBtnActive,
						]}
						onPress={() => setFilterStatus(s)}
					>
						<Text
							style={[
								styles.filterText,
								filterStatus === s && styles.filterTextActive,
							]}
						>
							{s === "all"
								? "All"
								: s === "in_progress"
									? "Active"
									: s.charAt(0).toUpperCase() + s.slice(1)}
						</Text>
					</TouchableOpacity>
				))}
			</View>

			{loading ? (
				<ActivityIndicator style={{marginTop: 40}} color="#3B82F6" />
			) : (
				<FlatList
					data={filteredTasks}
					renderItem={renderTask}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.list}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor="#3B82F6"
						/>
					}
					ListEmptyComponent={
						<View style={styles.empty}>
							<Text style={styles.emptyIcon}>📋</Text>
							<Text style={styles.emptyText}>No tasks</Text>
							<Text style={styles.emptySubtext}>
								Create tasks even offline — they sync when you reconnect
							</Text>
						</View>
					}
				/>
			)}

			{/* Create task */}
			<View style={styles.footer}>
				{showCreate ? (
					<View style={styles.createForm}>
						<TextInput
							style={styles.createInput}
							placeholder="What needs to be done?"
							placeholderTextColor="#64748B"
							value={newTitle}
							onChangeText={setNewTitle}
							autoFocus
						/>
						<View style={styles.optionRow}>
							<Text style={styles.optionLabel}>Priority:</Text>
							{["none", "low", "medium", "high", "urgent"].map((p) => (
								<TouchableOpacity
									key={p}
									style={[
										styles.optionChip,
										newPriority === p && {
											backgroundColor: priorityColors[p],
											borderColor: priorityColors[p],
										},
									]}
									onPress={() => setNewPriority(p)}
								>
									<Text
										style={[
											styles.optionChipText,
											newPriority === p && {color: "#FFF"},
										]}
									>
										{p.charAt(0).toUpperCase() + p.slice(1)}
									</Text>
								</TouchableOpacity>
							))}
						</View>
						<View style={styles.optionRow}>
							<Text style={styles.optionLabel}>Effort:</Text>
							{["low", "medium", "high"].map((e) => (
								<TouchableOpacity
									key={e}
									style={[
										styles.optionChip,
										newEffort === e && {
											backgroundColor: effortColors[e],
											borderColor: effortColors[e],
										},
									]}
									onPress={() => setNewEffort(newEffort === e ? "" : e)}
								>
									<Text
										style={[
											styles.optionChipText,
											newEffort === e && {color: "#FFF"},
										]}
									>
										{e.charAt(0).toUpperCase() + e.slice(1)}
									</Text>
								</TouchableOpacity>
							))}
						</View>
						<View style={styles.createActions}>
							<TouchableOpacity
								style={styles.cancelBtn}
								onPress={() => {
									setShowCreate(false);
									setNewTitle("");
								}}
							>
								<Text style={styles.cancelText}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.createBtn, creating && {opacity: 0.6}]}
								onPress={handleCreateTask}
								disabled={creating}
							>
								{creating ? (
									<ActivityIndicator size="small" color="#FFF" />
								) : (
									<Text style={styles.createText}>
										{isConnected ? "Create" : "Create Offline"}
									</Text>
								)}
							</TouchableOpacity>
						</View>
						{!isConnected && (
							<View style={styles.offlineHint}>
								<Text style={styles.offlineHintText}>
									📡 Task will be synced when you're back online
								</Text>
							</View>
						)}
					</View>
				) : (
					<TouchableOpacity
						style={styles.addButton}
						onPress={() => setShowCreate(true)}
					>
						<Text style={styles.addButtonText}>+ New Task</Text>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {flex: 1, backgroundColor: "#0F172A"},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingTop: 60,
		paddingBottom: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#1E293B",
	},
	headerLeft: {flex: 1, gap: 4},
	backBtn: {color: "#3B82F6", fontSize: 15, fontWeight: "600"},
	headerTitle: {fontSize: 22, fontWeight: "800", color: "#FFFFFF"},
	headerRight: {flexDirection: "row", alignItems: "center", gap: 6},
	pendingText: {fontSize: 11, color: "#F59E0B"},
	filterRow: {
		flexDirection: "row",
		paddingHorizontal: 16,
		paddingVertical: 10,
		gap: 6,
		borderBottomWidth: 1,
		borderBottomColor: "#1E293B",
	},
	filterBtn: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		backgroundColor: "#1E293B",
	},
	filterBtnActive: {backgroundColor: "#3B82F6"},
	filterText: {fontSize: 12, color: "#94A3B8", fontWeight: "600"},
	filterTextActive: {color: "#FFFFFF"},
	list: {padding: 16, gap: 8},
	taskCard: {
		backgroundColor: "#1E293B",
		borderRadius: 12,
		padding: 14,
	},
	taskLeft: {flexDirection: "row", alignItems: "flex-start", gap: 12},
	statusIcon: {fontSize: 18, marginTop: 2},
	taskContent: {flex: 1},
	taskTitleRow: {flexDirection: "row", alignItems: "center", gap: 8},
	taskTitle: {color: "#FFFFFF", fontSize: 15, fontWeight: "600", flex: 1},
	taskDone: {textDecorationLine: "line-through", color: "#64748B"},
	localBadge: {
		backgroundColor: "#F59E0B20",
		borderRadius: 6,
		paddingHorizontal: 6,
		paddingVertical: 2,
	},
	localBadgeText: {color: "#F59E0B", fontSize: 10, fontWeight: "700"},
	taskMeta: {flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6},
	priorityDot: {width: 8, height: 8, borderRadius: 4},
	effortDot: {width: 8, height: 8, borderRadius: 4, marginLeft: 4},
	metaText: {color: "#64748B", fontSize: 12},
	empty: {alignItems: "center", marginTop: 80},
	emptyIcon: {fontSize: 48, marginBottom: 12},
	emptyText: {color: "#FFFFFF", fontSize: 18, fontWeight: "600"},
	emptySubtext: {
		color: "#64748B",
		fontSize: 14,
		marginTop: 4,
		textAlign: "center",
		paddingHorizontal: 40,
	},
	footer: {padding: 16, borderTopWidth: 1, borderTopColor: "#1E293B"},
	createForm: {gap: 10},
	createInput: {
		backgroundColor: "#1E293B",
		borderRadius: 10,
		paddingHorizontal: 14,
		paddingVertical: 12,
		fontSize: 15,
		color: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#334155",
	},
	optionRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		flexWrap: "wrap",
	},
	optionLabel: {
		color: "#94A3B8",
		fontSize: 12,
		fontWeight: "600",
		marginRight: 2,
	},
	optionChip: {
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#334155",
	},
	optionChipText: {fontSize: 11, color: "#94A3B8", fontWeight: "600"},
	createActions: {flexDirection: "row", gap: 10},
	cancelBtn: {
		flex: 1,
		paddingVertical: 12,
		alignItems: "center",
		borderRadius: 10,
		backgroundColor: "#1E293B",
	},
	cancelText: {color: "#94A3B8", fontSize: 14, fontWeight: "600"},
	createBtn: {
		flex: 1,
		paddingVertical: 12,
		alignItems: "center",
		borderRadius: 10,
		backgroundColor: "#3B82F6",
	},
	createText: {color: "#FFFFFF", fontSize: 14, fontWeight: "600"},
	addButton: {
		backgroundColor: "#3B82F6",
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: "center",
	},
	addButtonText: {color: "#FFFFFF", fontSize: 16, fontWeight: "700"},
	offlineHint: {
		backgroundColor: "#F59E0B15",
		borderRadius: 8,
		padding: 10,
		alignItems: "center",
	},
	offlineHintText: {color: "#F59E0B", fontSize: 12, fontWeight: "500"},
});
