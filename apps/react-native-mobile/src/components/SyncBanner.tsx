import React, {useEffect, useRef} from "react";
import {View, Text, Animated, TouchableOpacity, StyleSheet} from "react-native";
import {useNetwork} from "../context/NetworkContext";

export default function SyncBanner() {
	const {isConnected, pendingSync, lastSyncResult, syncNow} = useNetwork();
	const slideAnim = useRef(new Animated.Value(-60)).current;

	const show = !isConnected || pendingSync > 0;

	useEffect(() => {
		Animated.timing(slideAnim, {
			toValue: show ? 0 : -60,
			duration: 300,
			useNativeDriver: true,
		}).start();
	}, [show, slideAnim]);

	if (!show && !lastSyncResult) return null;

	return (
		<Animated.View
			style={[styles.container, {transform: [{translateY: slideAnim}]}]}
		>
			{!isConnected ? (
				<View style={[styles.banner, styles.offline]}>
					<Text style={styles.icon}>📡</Text>
					<Text style={styles.text}>
						You&apos;re offline{" "}
						{pendingSync > 0 ? `· ${pendingSync} pending` : ""}
					</Text>
				</View>
			) : pendingSync > 0 ? (
				<TouchableOpacity
					style={[styles.banner, styles.syncing]}
					onPress={syncNow}
				>
					<Text style={styles.icon}>🔄</Text>
					<Text style={styles.text}>
						{pendingSync} change{pendingSync > 1 ? "s" : ""} to sync · Tap to
						sync now
					</Text>
				</TouchableOpacity>
			) : null}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		zIndex: 100,
	},
	banner: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	offline: {
		backgroundColor: "#EF4444",
	},
	syncing: {
		backgroundColor: "#F59E0B",
	},
	icon: {
		fontSize: 14,
		marginRight: 8,
	},
	text: {
		color: "#FFFFFF",
		fontSize: 13,
		fontWeight: "600",
	},
});
