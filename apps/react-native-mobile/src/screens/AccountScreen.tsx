import React, {useState} from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	Alert,
	ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useAuth} from "../context/AuthContext";
import {useNetwork} from "../context/NetworkContext";
import NetworkBadge from "../components/NetworkBadge";

export default function AccountScreen() {
	const {user, isLoggedIn, signIn, signUp, signOut} = useAuth();
	const {isConnected, pendingSync, syncNow} = useNetwork();
	const [isSignUpMode, setIsSignUpMode] = useState(false);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [apiUrl, setApiUrl] = useState("");
	const [showSettings, setShowSettings] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleAuth = async () => {
		if (!email.trim() || !password.trim()) {
			Alert.alert("Error", "Please fill in email and password");
			return;
		}
		if (isSignUpMode && !name.trim()) {
			Alert.alert("Error", "Please enter your name");
			return;
		}
		if (!isConnected) {
			Alert.alert(
				"Offline",
				"You need internet to sign in. Your local data is safe."
			);
			return;
		}

		setLoading(true);
		const ok = isSignUpMode
			? await signUp(name, email, password)
			: await signIn(email, password);
		setLoading(false);

		if (ok) {
			Alert.alert(
				"Success",
				isSignUpMode
					? "Account created! Your offline data will sync."
					: "Signed in! Your offline data will sync.",
				[
					{text: "Sync Now", onPress: () => syncNow()},
					{text: "Later", style: "cancel"},
				]
			);
		} else {
			Alert.alert(
				"Error",
				isSignUpMode
					? "Sign up failed. Try a different email."
					: "Invalid email or password."
			);
		}
	};

	const handleSignOut = () => {
		Alert.alert(
			"Sign Out",
			"Your local data will remain on this device. You can sign in again later to sync.",
			[
				{text: "Cancel", style: "cancel"},
				{text: "Sign Out", style: "destructive", onPress: signOut},
			]
		);
	};

	const saveApiUrl = async () => {
		if (apiUrl.trim()) {
			await AsyncStorage.setItem("@pluteo/api_base", apiUrl.trim());
			Alert.alert("Saved", `API URL set to: ${apiUrl.trim()}`);
		} else {
			await AsyncStorage.removeItem("@pluteo/api_base");
			Alert.alert("Saved", "API URL reset to default");
		}
		setShowSettings(false);
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Account</Text>
				<NetworkBadge />
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.scrollContent}
			>
				{isLoggedIn ? (
					<>
						{/* Signed in state */}
						<View style={styles.profileCard}>
							<View style={styles.avatar}>
								<Text style={styles.avatarText}>
									{user?.name?.charAt(0).toUpperCase() || "?"}
								</Text>
							</View>
							<View style={styles.profileInfo}>
								<Text style={styles.profileName}>{user?.name}</Text>
								<Text style={styles.profileEmail}>{user?.email}</Text>
							</View>
						</View>

						<View style={styles.statusCard}>
							<Text style={styles.statusIcon}>{isConnected ? "🟢" : "🔴"}</Text>
							<View>
								<Text style={styles.statusTitle}>
									{isConnected ? "Connected to server" : "Working offline"}
								</Text>
								<Text style={styles.statusSubtext}>
									{pendingSync > 0
										? `${pendingSync} change${pendingSync > 1 ? "s" : ""} pending sync`
										: "All data synced"}
								</Text>
							</View>
						</View>

						<TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
							<Text style={styles.signOutBtnText}>Sign Out</Text>
						</TouchableOpacity>
					</>
				) : (
					<>
						{/* Not signed in state */}
						<View style={styles.infoCard}>
							<Text style={styles.infoTitle}>Works Without an Account</Text>
							<Text style={styles.infoText}>
								All your projects and tasks are stored locally on this device.
								No account needed.
							</Text>
							<Text style={styles.infoText}>
								Sign in optionally to sync your data to the cloud, access it
								from the web app, and collaborate with your team.
							</Text>
						</View>

						<View style={styles.authSection}>
							<Text style={styles.sectionTitle}>
								{isSignUpMode ? "CREATE ACCOUNT" : "SIGN IN"}
							</Text>

							{isSignUpMode && (
								<TextInput
									style={styles.input}
									placeholder="Full Name"
									placeholderTextColor="#64748B"
									value={name}
									onChangeText={setName}
									autoCapitalize="words"
								/>
							)}
							<TextInput
								style={styles.input}
								placeholder="Email"
								placeholderTextColor="#64748B"
								value={email}
								onChangeText={setEmail}
								keyboardType="email-address"
								autoCapitalize="none"
							/>
							<TextInput
								style={styles.input}
								placeholder="Password"
								placeholderTextColor="#64748B"
								value={password}
								onChangeText={setPassword}
								secureTextEntry
							/>

							<TouchableOpacity
								style={[styles.authBtn, loading && {opacity: 0.6}]}
								onPress={handleAuth}
								disabled={loading}
							>
								{loading ? (
									<ActivityIndicator color="#FFF" />
								) : (
									<Text style={styles.authBtnText}>
										{isSignUpMode ? "Create Account" : "Sign In"}
									</Text>
								)}
							</TouchableOpacity>

							<TouchableOpacity onPress={() => setIsSignUpMode(!isSignUpMode)}>
								<Text style={styles.switchText}>
									{isSignUpMode
										? "Already have an account? Sign In"
										: "Don't have an account? Sign Up"}
								</Text>
							</TouchableOpacity>
						</View>
					</>
				)}

				{/* Server settings */}
				<TouchableOpacity
					style={styles.settingsToggle}
					onPress={() => setShowSettings(!showSettings)}
				>
					<Text style={styles.settingsToggleText}>
						{showSettings ? "Hide Server Settings" : "Server Settings"}
					</Text>
				</TouchableOpacity>

				{showSettings && (
					<View style={styles.settingsPanel}>
						<Text style={styles.settingsHint}>
							Set the API URL to connect to your Pluteo server. Leave empty for
							default.
						</Text>
						<TextInput
							style={styles.input}
							placeholder="http://192.168.1.x:3020"
							placeholderTextColor="#64748B"
							value={apiUrl}
							onChangeText={setApiUrl}
							autoCapitalize="none"
						/>
						<TouchableOpacity style={styles.saveBtn} onPress={saveApiUrl}>
							<Text style={styles.saveBtnText}>Save</Text>
						</TouchableOpacity>
					</View>
				)}
			</ScrollView>
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
	scrollContent: {padding: 16, gap: 16},
	profileCard: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		backgroundColor: "#1E293B",
		borderRadius: 14,
		padding: 16,
	},
	avatar: {
		width: 52,
		height: 52,
		borderRadius: 26,
		backgroundColor: "#3B82F6",
		alignItems: "center",
		justifyContent: "center",
	},
	avatarText: {color: "#FFF", fontSize: 22, fontWeight: "700"},
	profileInfo: {flex: 1},
	profileName: {color: "#FFFFFF", fontSize: 18, fontWeight: "700"},
	profileEmail: {color: "#64748B", fontSize: 14, marginTop: 2},
	statusCard: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		backgroundColor: "#1E293B",
		borderRadius: 14,
		padding: 16,
	},
	statusIcon: {fontSize: 20},
	statusTitle: {color: "#FFFFFF", fontSize: 14, fontWeight: "600"},
	statusSubtext: {color: "#64748B", fontSize: 12, marginTop: 2},
	signOutBtn: {
		backgroundColor: "#1E293B",
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#EF444440",
	},
	signOutBtnText: {color: "#EF4444", fontSize: 15, fontWeight: "600"},
	infoCard: {
		backgroundColor: "#1E293B",
		borderRadius: 14,
		padding: 16,
		gap: 10,
	},
	infoTitle: {color: "#FFFFFF", fontSize: 16, fontWeight: "700"},
	infoText: {color: "#94A3B8", fontSize: 14, lineHeight: 20},
	authSection: {gap: 12},
	sectionTitle: {
		color: "#94A3B8",
		fontSize: 13,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	input: {
		backgroundColor: "#1E293B",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		color: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#334155",
	},
	authBtn: {
		backgroundColor: "#3B82F6",
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: "center",
	},
	authBtnText: {color: "#FFFFFF", fontSize: 16, fontWeight: "700"},
	switchText: {color: "#60A5FA", fontSize: 14, textAlign: "center"},
	settingsToggle: {alignItems: "center", paddingVertical: 8},
	settingsToggleText: {color: "#64748B", fontSize: 13},
	settingsPanel: {gap: 10},
	settingsHint: {color: "#64748B", fontSize: 13},
	saveBtn: {
		backgroundColor: "#334155",
		borderRadius: 8,
		paddingVertical: 10,
		alignItems: "center",
	},
	saveBtnText: {color: "#FFFFFF", fontSize: 14, fontWeight: "600"},
});
