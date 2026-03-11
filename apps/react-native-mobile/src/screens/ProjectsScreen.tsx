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
	getCachedProjects,
	setCachedProjects,
	addLocalProject,
	removeLocalProject,
	type LocalProject,
} from "../services/storage";
import {addToSyncQueue} from "../services/offlineSync";
import NetworkBadge from "../components/NetworkBadge";

export default function ProjectsScreen({navigation}: {navigation: any}) {
	const {isLoggedIn} = useAuth();
	const {isConnected, pendingSync} = useNetwork();
	const [projects, setProjects] = useState<LocalProject[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [showCreate, setShowCreate] = useState(false);
	const [newProjectName, setNewProjectName] = useState("");
	const [creating, setCreating] = useState(false);

	const fetchProjects = useCallback(async () => {
		if (isConnected && isLoggedIn) {
			// Fetch from server and merge with local-only projects
			const res = await apiFetch<LocalProject[]>("/api/v1/projects/");
			if (res.isSuccess && res.data) {
				const cached = await getCachedProjects();
				const localOnly = cached.filter((p) => p.isLocal);
				const merged = [...res.data, ...localOnly];
				setProjects(merged);
				await setCachedProjects(merged);
			} else {
				const cached = await getCachedProjects();
				setProjects(cached);
			}
		} else {
			const cached = await getCachedProjects();
			setProjects(cached);
		}
		setLoading(false);
	}, [isConnected, isLoggedIn]);

	useEffect(() => {
		fetchProjects();
	}, [fetchProjects]);

	// Refresh on navigate back
	useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			fetchProjects();
		});
		return unsubscribe;
	}, [navigation, fetchProjects]);

	const onRefresh = async () => {
		setRefreshing(true);
		await fetchProjects();
		setRefreshing(false);
	};

	const handleCreateProject = async () => {
		if (!newProjectName.trim()) return;
		setCreating(true);

		if (isConnected && isLoggedIn) {
			// Try to create on server
			// First ensure we have an active org
			const orgsRes = await apiFetch<{id: string}[]>(
				"/api/v1/auth/organization/list"
			);
			if (orgsRes.data && orgsRes.data.length > 0) {
				const orgId = orgsRes.data[0].id;
				await apiFetch("/api/v1/auth/organization/set-active", {
					method: "POST",
					body: JSON.stringify({organizationId: orgId}),
				});
				const res = await apiFetch<LocalProject>("/api/v1/projects/", {
					method: "POST",
					body: JSON.stringify({
						name: newProjectName.trim(),
						organizationId: orgId,
					}),
				});
				if (res.isSuccess && res.data) {
					const project = {...res.data, isLocal: false};
					setProjects((prev) => [...prev, project]);
					const cached = await getCachedProjects();
					cached.push(project);
					await setCachedProjects(cached);
					setNewProjectName("");
					setShowCreate(false);
					setCreating(false);
					return;
				}
			}
		}

		// Offline or no auth — create locally
		const localId = Crypto.randomUUID();
		const project: LocalProject = {
			id: localId,
			name: newProjectName.trim(),
			organizationId: "",
			isLocal: true,
		};
		await addLocalProject(project);
		setProjects((prev) => [...prev, project]);

		// Queue for sync when signed in and online
		await addToSyncQueue({
			type: "create_project",
			localId,
			payload: {name: newProjectName.trim()},
		});

		setNewProjectName("");
		setShowCreate(false);
		setCreating(false);
	};

	const handleDeleteProject = (project: LocalProject) => {
		Alert.alert(
			"Delete Project",
			`Delete "${project.name}" and all its tasks?`,
			[
				{text: "Cancel", style: "cancel"},
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						setProjects((prev) => prev.filter((p) => p.id !== project.id));
						await removeLocalProject(project.id);

						if (!project.isLocal && isConnected && isLoggedIn) {
							await apiFetch(`/api/v1/projects/${project.id}`, {
								method: "DELETE",
							});
						} else if (!project.isLocal) {
							await addToSyncQueue({
								type: "delete_project",
								projectId: project.id,
							});
						}
					},
				},
			]
		);
	};

	const renderProject = ({item}: {item: LocalProject}) => (
		<TouchableOpacity
			style={styles.projectCard}
			onPress={() =>
				navigation.navigate("Tasks", {
					projectId: item.id,
					projectName: item.name,
				})
			}
			onLongPress={() => handleDeleteProject(item)}
			activeOpacity={0.7}
		>
			<View style={styles.projectIcon}>
				<Text style={styles.projectIconText}>
					{item.name.charAt(0).toUpperCase()}
				</Text>
			</View>
			<View style={styles.projectInfo}>
				<Text style={styles.projectName}>{item.name}</Text>
				{item.isLocal && <Text style={styles.localLabel}>Local only</Text>}
			</View>
			<Text style={styles.chevron}>›</Text>
		</TouchableOpacity>
	);

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<View>
					<Text style={styles.headerTitle}>Projects</Text>
					<Text style={styles.subtitle}>
						{isLoggedIn ? "Synced to cloud" : "Stored locally"}
					</Text>
				</View>
				<View style={styles.headerRight}>
					<NetworkBadge />
					{pendingSync > 0 && (
						<Text style={styles.pendingText}>{pendingSync} pending</Text>
					)}
				</View>
			</View>

			{loading ? (
				<ActivityIndicator style={{marginTop: 40}} color="#3B82F6" />
			) : (
				<FlatList
					data={projects}
					renderItem={renderProject}
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
							<Text style={styles.emptyIcon}>📁</Text>
							<Text style={styles.emptyText}>No projects yet</Text>
							<Text style={styles.emptySubtext}>
								Create your first project — works offline, no account needed
							</Text>
						</View>
					}
				/>
			)}

			{/* Create Project — always available */}
			<View style={styles.footer}>
				{showCreate ? (
					<View style={styles.createForm}>
						<TextInput
							style={styles.createInput}
							placeholder="Project name"
							placeholderTextColor="#64748B"
							value={newProjectName}
							onChangeText={setNewProjectName}
							autoFocus
						/>
						<View style={styles.createActions}>
							<TouchableOpacity
								style={styles.cancelBtn}
								onPress={() => {
									setShowCreate(false);
									setNewProjectName("");
								}}
							>
								<Text style={styles.cancelText}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.createBtn, creating && {opacity: 0.6}]}
								onPress={handleCreateProject}
								disabled={creating}
							>
								{creating ? (
									<ActivityIndicator size="small" color="#FFF" />
								) : (
									<Text style={styles.createText}>Create</Text>
								)}
							</TouchableOpacity>
						</View>
						{!isLoggedIn && (
							<View style={styles.offlineHint}>
								<Text style={styles.offlineHintText}>
									💾 Saved locally · Sign in later to sync to cloud
								</Text>
							</View>
						)}
					</View>
				) : (
					<TouchableOpacity
						style={styles.addButton}
						onPress={() => setShowCreate(true)}
					>
						<Text style={styles.addButtonText}>+ New Project</Text>
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
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#1E293B",
	},
	headerTitle: {fontSize: 28, fontWeight: "800", color: "#FFFFFF"},
	subtitle: {fontSize: 13, color: "#64748B", marginTop: 2},
	headerRight: {flexDirection: "row", alignItems: "center", gap: 10},
	pendingText: {fontSize: 11, color: "#F59E0B"},
	list: {padding: 16, gap: 10},
	projectCard: {
		backgroundColor: "#1E293B",
		borderRadius: 14,
		padding: 16,
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	projectIcon: {
		width: 44,
		height: 44,
		borderRadius: 12,
		backgroundColor: "#3B82F6",
		alignItems: "center",
		justifyContent: "center",
	},
	projectIconText: {color: "#FFF", fontSize: 18, fontWeight: "700"},
	projectInfo: {flex: 1},
	projectName: {color: "#FFFFFF", fontSize: 16, fontWeight: "600"},
	localLabel: {color: "#F59E0B", fontSize: 11, fontWeight: "600", marginTop: 2},
	chevron: {color: "#475569", fontSize: 24},
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
	addButton: {
		backgroundColor: "#3B82F6",
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: "center",
	},
	addButtonText: {color: "#FFFFFF", fontSize: 16, fontWeight: "700"},
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
	offlineHint: {
		backgroundColor: "#F59E0B15",
		borderRadius: 8,
		padding: 10,
		alignItems: "center",
	},
	offlineHintText: {color: "#F59E0B", fontSize: 12, fontWeight: "500"},
});
