import React, {useState, useCallback} from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	ActivityIndicator,
	Alert,
} from "react-native";
import {useFocusEffect} from "@react-navigation/native";
import {useAuth} from "../context/AuthContext";
import {useNetwork} from "../context/NetworkContext";
import {
	getSyncQueue,
	clearSyncQueue,
	type SyncAction,
} from "../services/offlineSync";
import NetworkBadge from "../components/NetworkBadge";

export default function SyncScreen() {
	const {isLoggedIn} = useAuth();
	const {isConnected, pendingSync, lastSyncResult, syncNow} = useNetwork();
	const [queue, setQueue] = useState<SyncAction[]>([]);
	const [syncing, setSyncing] = useState(false);

	useFocusEffect(
		useCallback(() => {
			loadQueue();
		}, [])
	);

	const loadQueue = async () => {
		const q = await getSyncQueue();
		setQueue(q);
	};

	const handleSync = async () => {
		if (!isLoggedIn) {
			Alert.alert(
				"Sign In Required",
				"Go to Account tab to sign in, then sync your data to the cloud."
			);
			return;
		}
		if (!isConnected) {
			Alert.alert("Offline", "You need an internet connection to sync.");
			return;
		}
		setSyncing(true);
		await syncNow();
		await loadQueue();
		setSyncing(false);
	};

	const handleClearQueue = () => {
		Alert.alert(
			"Clear Sync Queue",
			"This will discard all pending offline changes. They will NOT be synced to the server. Continue?",
			[
				{text: "Cancel", style: "cancel"},
				{
					text: "Clear All",
					style: "destructive",
					onPress: async () => {
						await clearSyncQueue();
						await loadQueue();
					},
				},
			]
		);
	};

	const getActionIcon = (type: string) => {
		switch (type) {
			case "create_task":
				return "➕";
			case "update_task":
				return "✏️";
			case "delete_task":
				return "🗑️";
			default:
				return "📦";
		}
	};

	const getActionLabel = (action: SyncAction) => {
		switch (action.type) {
			case "create_project":
				return `Create project: ${(action.payload?.name as string) || "Untitled"}`;
			case "delete_project":
				return `Delete project ${action.projectId.slice(0, 8)}...`;
			case "create_task":
				return `Create task: ${(action.payload?.title as string) || "Untitled"}`;
			case "update_task":
				return `Update task ${action.taskId.slice(0, 8)}...`;
			case "delete_task":
				return `Delete task ${action.taskId.slice(0, 8)}...`;
			default:
				return "Unknown action";
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Sync Status</Text>
				<NetworkBadge />
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.scrollContent}
			>
				{/* Connection status */}
				<View
					style={[
						styles.statusCard,
						{borderColor: isConnected ? "#22C55E40" : "#EF444440"},
					]}
				>
					<Text style={styles.statusIcon}>{isConnected ? "🟢" : "🔴"}</Text>
					<View>
						<Text style={styles.statusTitle}>
							{isConnected ? "Connected" : "Offline"}
						</Text>
						<Text style={styles.statusSubtext}>
							{isConnected
								? "All changes will sync immediately"
								: "Changes are saved locally and will sync when you reconnect"}
						</Text>
					</View>
				</View>

				{/* Pending changes */}
				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>
							Pending Changes ({queue.length})
						</Text>
						{queue.length > 0 && (
							<TouchableOpacity onPress={handleClearQueue}>
								<Text style={styles.clearText}>Clear All</Text>
							</TouchableOpacity>
						)}
					</View>

					{queue.length === 0 ? (
						<View style={styles.emptyQueue}>
							<Text style={styles.emptyIcon}>✅</Text>
							<Text style={styles.emptyText}>All synced!</Text>
							<Text style={styles.emptySubtext}>
								No pending offline changes
							</Text>
						</View>
					) : (
						<View style={styles.queueList}>
							{queue.map((action, idx) => (
								<View key={idx} style={styles.queueItem}>
									<Text style={styles.queueIcon}>
										{getActionIcon(action.type)}
									</Text>
									<Text style={styles.queueLabel} numberOfLines={1}>
										{getActionLabel(action)}
									</Text>
								</View>
							))}
						</View>
					)}
				</View>

				{/* Last sync result */}
				{lastSyncResult && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Last Sync Result</Text>
						<View style={styles.resultCard}>
							<View style={styles.resultRow}>
								<Text style={styles.resultLabel}>Synced:</Text>
								<Text style={[styles.resultValue, {color: "#22C55E"}]}>
									{lastSyncResult.synced}
								</Text>
							</View>
							<View style={styles.resultRow}>
								<Text style={styles.resultLabel}>Failed:</Text>
								<Text
									style={[
										styles.resultValue,
										{color: lastSyncResult.failed > 0 ? "#EF4444" : "#22C55E"},
									]}
								>
									{lastSyncResult.failed}
								</Text>
							</View>
							{lastSyncResult.errors.length > 0 && (
								<View style={styles.errorList}>
									{lastSyncResult.errors.map((err, idx) => (
										<Text key={idx} style={styles.errorItem}>
											{err}
										</Text>
									))}
								</View>
							)}
						</View>
					</View>
				)}

				{/* Sign in hint */}
				{!isLoggedIn && queue.length > 0 && (
					<View style={styles.section}>
						<View style={[styles.statusCard, {borderColor: "#3B82F640"}]}>
							<Text style={styles.statusIcon}>👤</Text>
							<View>
								<Text style={styles.statusTitle}>Sign in to sync</Text>
								<Text style={styles.statusSubtext}>
									Go to the Account tab to sign in or create an account. Your
									offline data will sync to the cloud.
								</Text>
							</View>
						</View>
					</View>
				)}

				{/* How it works */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>How It Works</Text>
					<View style={styles.infoCard}>
						<View style={styles.infoRow}>
							<Text style={styles.infoIcon}>📝</Text>
							<Text style={styles.infoText}>
								Create projects and tasks anytime — no account or internet
								needed
							</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoIcon}>💾</Text>
							<Text style={styles.infoText}>
								Everything is saved locally on your device
							</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoIcon}>👤</Text>
							<Text style={styles.infoText}>
								Optionally sign in to sync data to the cloud and access from the
								web
							</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoIcon}>🔄</Text>
							<Text style={styles.infoText}>
								When signed in, changes auto-sync when internet returns
							</Text>
						</View>
					</View>
				</View>
			</ScrollView>

			{/* Sync button */}
			{queue.length > 0 && (
				<View style={styles.footer}>
					<TouchableOpacity
						style={[
							styles.syncButton,
							(!isConnected || !isLoggedIn || syncing) && {opacity: 0.5},
						]}
						onPress={handleSync}
						disabled={!isConnected || !isLoggedIn || syncing}
					>
						{syncing ? (
							<ActivityIndicator color="#FFF" />
						) : (
							<Text style={styles.syncButtonText}>
								{!isLoggedIn
									? "Sign in to sync"
									: isConnected
										? `Sync ${queue.length} Change${queue.length > 1 ? "s" : ""} Now`
										: "Waiting for Connection..."}
							</Text>
						)}
					</TouchableOpacity>
				</View>
			)}
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
	scroll: {flex: 1},
	scrollContent: {padding: 16, gap: 20},
	statusCard: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		backgroundColor: "#1E293B",
		borderRadius: 14,
		padding: 16,
		borderWidth: 1,
	},
	statusIcon: {fontSize: 24},
	statusTitle: {color: "#FFFFFF", fontSize: 16, fontWeight: "700"},
	statusSubtext: {color: "#64748B", fontSize: 13, marginTop: 2, maxWidth: 260},
	section: {gap: 10},
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	sectionTitle: {
		color: "#94A3B8",
		fontSize: 13,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	clearText: {color: "#EF4444", fontSize: 13, fontWeight: "600"},
	emptyQueue: {alignItems: "center", paddingVertical: 24},
	emptyIcon: {fontSize: 32, marginBottom: 8},
	emptyText: {color: "#FFFFFF", fontSize: 16, fontWeight: "600"},
	emptySubtext: {color: "#64748B", fontSize: 13, marginTop: 2},
	queueList: {gap: 6},
	queueItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		backgroundColor: "#1E293B",
		borderRadius: 10,
		padding: 12,
	},
	queueIcon: {fontSize: 16},
	queueLabel: {color: "#FFFFFF", fontSize: 14, flex: 1},
	resultCard: {
		backgroundColor: "#1E293B",
		borderRadius: 10,
		padding: 14,
		gap: 8,
	},
	resultRow: {flexDirection: "row", justifyContent: "space-between"},
	resultLabel: {color: "#94A3B8", fontSize: 14},
	resultValue: {fontSize: 14, fontWeight: "700"},
	errorList: {marginTop: 4, gap: 4},
	errorItem: {color: "#EF4444", fontSize: 12},
	infoCard: {
		backgroundColor: "#1E293B",
		borderRadius: 14,
		padding: 16,
		gap: 14,
	},
	infoRow: {flexDirection: "row", gap: 12, alignItems: "flex-start"},
	infoIcon: {fontSize: 16, marginTop: 1},
	infoText: {color: "#CBD5E1", fontSize: 14, flex: 1, lineHeight: 20},
	footer: {padding: 16, borderTopWidth: 1, borderTopColor: "#1E293B"},
	syncButton: {
		backgroundColor: "#3B82F6",
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: "center",
	},
	syncButtonText: {color: "#FFFFFF", fontSize: 16, fontWeight: "700"},
});
