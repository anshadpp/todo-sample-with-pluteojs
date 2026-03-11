import React, {useEffect, useState} from "react";
import {
	View,
	Text,
	ScrollView,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Alert,
	ActivityIndicator,
} from "react-native";
import {useAuth} from "../context/AuthContext";
import {useNetwork} from "../context/NetworkContext";
import {apiFetch} from "../services/api";
import {
	getCachedTasks,
	updateLocalTask,
	type LocalTask,
} from "../services/storage";
import {addToSyncQueue} from "../services/offlineSync";

const priorities = ["none", "low", "medium", "high", "urgent"] as const;
const statuses = ["open", "in_progress", "review", "done", "closed"] as const;
const efforts = ["low", "medium", "high"] as const;

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

const statusLabels: Record<string, string> = {
	open: "Open",
	in_progress: "In Progress",
	review: "Review",
	done: "Done",
	closed: "Closed",
};

export default function TaskDetailScreen({
	route,
	navigation,
}: {
	route: any;
	navigation: any;
}) {
	const {taskId, projectId, isLocal} = route.params;
	const {isLoggedIn} = useAuth();
	const {isConnected} = useNetwork();
	const [task, setTask] = useState<LocalTask | null>(null);
	const [loading, setLoading] = useState(true);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [priority, setPriority] = useState("none");
	const [status, setStatus] = useState("open");
	const [effort, setEffort] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		(async () => {
			// Always try cache first (works offline, no account needed)
			const cached = await getCachedTasks(projectId);
			const found = cached.find((t) => t.id === taskId);
			if (found) {
				setTask(found);
				setTitle(found.title);
				setDescription(found.description || "");
				setPriority(found.priority);
				setStatus(found.status);
				setEffort(found.effortLevel || "");
			}

			// If connected + logged in + not a local-only task, fetch fresh from server
			if (!isLocal && isConnected && isLoggedIn) {
				const res = await apiFetch<LocalTask>(`/api/v1/tasks/${taskId}`);
				if (res.isSuccess && res.data) {
					setTask(res.data);
					setTitle(res.data.title);
					setDescription(res.data.description || "");
					setPriority(res.data.priority);
					setStatus(res.data.status);
					setEffort(res.data.effortLevel || "");
				}
			}
			setLoading(false);
		})();
	}, [taskId, projectId, isLocal, isConnected, isLoggedIn]);

	const handleSave = async () => {
		if (!title.trim()) {
			Alert.alert("Error", "Title is required");
			return;
		}
		setSaving(true);

		const updates: Record<string, unknown> = {
			title: title.trim(),
			description: description.trim() || null,
			priority,
			status,
			effortLevel: effort || null,
		};

		// Always save to local cache
		await updateLocalTask(projectId, taskId, {
			title: title.trim(),
			description: description.trim() || null,
			priority,
			status,
			effortLevel: effort || null,
		});

		if (isLocal) {
			// Local-only task — already saved above, sync queue already has the create action
		} else if (isConnected && isLoggedIn) {
			// Server task + online + logged in — push to server
			const res = await apiFetch(`/api/v1/tasks/${taskId}`, {
				method: "PATCH",
				body: JSON.stringify(updates),
			});
			if (!res.isSuccess) {
				Alert.alert("Note", "Saved locally. Will sync when possible.");
				await addToSyncQueue({
					type: "update_task",
					taskId,
					projectId,
					payload: updates,
				});
			}
		} else {
			// Server task but offline or not logged in — queue for sync
			await addToSyncQueue({
				type: "update_task",
				taskId,
				projectId,
				payload: updates,
			});
		}

		setSaving(false);
		navigation.goBack();
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator color="#3B82F6" size="large" />
			</View>
		);
	}

	if (!task) {
		return (
			<View style={styles.loadingContainer}>
				<Text style={styles.errorText}>Task not found</Text>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.backLink}>Go Back</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.backBtn}>‹ Back</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.saveBtn, saving && {opacity: 0.6}]}
					onPress={handleSave}
					disabled={saving}
				>
					{saving ? (
						<ActivityIndicator size="small" color="#FFF" />
					) : (
						<Text style={styles.saveBtnText}>Save</Text>
					)}
				</TouchableOpacity>
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.scrollContent}
			>
				{/* Local badge */}
				{(isLocal || task.isLocal) && (
					<View style={styles.offlineBanner}>
						<Text style={styles.offlineBannerText}>
							📡 Created offline — will sync when connected
						</Text>
					</View>
				)}

				{/* Title */}
				<TextInput
					style={styles.titleInput}
					value={title}
					onChangeText={setTitle}
					placeholder="Task title"
					placeholderTextColor="#64748B"
					multiline
				/>

				{/* Description */}
				<Text style={styles.sectionLabel}>Description</Text>
				<TextInput
					style={styles.descInput}
					value={description}
					onChangeText={setDescription}
					placeholder="Add a description..."
					placeholderTextColor="#64748B"
					multiline
					textAlignVertical="top"
				/>

				{/* Status */}
				<Text style={styles.sectionLabel}>Status</Text>
				<View style={styles.chipRow}>
					{statuses.map((s) => (
						<TouchableOpacity
							key={s}
							style={[styles.chip, status === s && styles.chipActive]}
							onPress={() => setStatus(s)}
						>
							<Text
								style={[styles.chipText, status === s && styles.chipTextActive]}
							>
								{statusLabels[s]}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Priority */}
				<Text style={styles.sectionLabel}>Priority</Text>
				<View style={styles.chipRow}>
					{priorities.map((p) => (
						<TouchableOpacity
							key={p}
							style={[
								styles.chip,
								priority === p && {
									backgroundColor: priorityColors[p],
									borderColor: priorityColors[p],
								},
							]}
							onPress={() => setPriority(p)}
						>
							<Text
								style={[styles.chipText, priority === p && {color: "#FFF"}]}
							>
								{p.charAt(0).toUpperCase() + p.slice(1)}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Effort Level */}
				<Text style={styles.sectionLabel}>Effort Level</Text>
				<View style={styles.chipRow}>
					{efforts.map((e) => (
						<TouchableOpacity
							key={e}
							style={[
								styles.chip,
								effort === e && {
									backgroundColor: effortColors[e],
									borderColor: effortColors[e],
								},
							]}
							onPress={() => setEffort(effort === e ? "" : e)}
						>
							<Text style={[styles.chipText, effort === e && {color: "#FFF"}]}>
								{e.charAt(0).toUpperCase() + e.slice(1)}
							</Text>
						</TouchableOpacity>
					))}
					{effort && (
						<TouchableOpacity onPress={() => setEffort("")}>
							<Text style={styles.clearText}>Clear</Text>
						</TouchableOpacity>
					)}
				</View>

				{/* Timestamps */}
				<View style={styles.timestamps}>
					<Text style={styles.timestampText}>
						Created: {new Date(task.createdAt).toLocaleString()}
					</Text>
					<Text style={styles.timestampText}>
						Updated: {new Date(task.updatedAt).toLocaleString()}
					</Text>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {flex: 1, backgroundColor: "#0F172A"},
	loadingContainer: {
		flex: 1,
		backgroundColor: "#0F172A",
		justifyContent: "center",
		alignItems: "center",
	},
	errorText: {color: "#EF4444", fontSize: 16},
	backLink: {color: "#3B82F6", fontSize: 14, marginTop: 10},
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
	backBtn: {color: "#3B82F6", fontSize: 15, fontWeight: "600"},
	saveBtn: {
		backgroundColor: "#3B82F6",
		borderRadius: 8,
		paddingHorizontal: 20,
		paddingVertical: 8,
	},
	saveBtnText: {color: "#FFFFFF", fontSize: 14, fontWeight: "700"},
	scroll: {flex: 1},
	scrollContent: {padding: 20, gap: 16},
	offlineBanner: {
		backgroundColor: "#F59E0B15",
		borderRadius: 10,
		padding: 12,
		alignItems: "center",
	},
	offlineBannerText: {color: "#F59E0B", fontSize: 13, fontWeight: "500"},
	titleInput: {
		fontSize: 22,
		fontWeight: "700",
		color: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#1E293B",
		paddingBottom: 12,
	},
	sectionLabel: {
		fontSize: 13,
		fontWeight: "700",
		color: "#94A3B8",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	descInput: {
		backgroundColor: "#1E293B",
		borderRadius: 10,
		padding: 14,
		fontSize: 15,
		color: "#FFFFFF",
		minHeight: 100,
		borderWidth: 1,
		borderColor: "#334155",
	},
	chipRow: {flexDirection: "row", flexWrap: "wrap", gap: 8},
	chip: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: "#334155",
		backgroundColor: "#1E293B",
	},
	chipActive: {backgroundColor: "#3B82F6", borderColor: "#3B82F6"},
	chipText: {fontSize: 13, color: "#94A3B8", fontWeight: "600"},
	chipTextActive: {color: "#FFFFFF"},
	clearText: {
		color: "#64748B",
		fontSize: 12,
		marginLeft: 4,
		alignSelf: "center",
	},
	timestamps: {
		marginTop: 16,
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: "#1E293B",
		gap: 4,
	},
	timestampText: {color: "#475569", fontSize: 12},
});
