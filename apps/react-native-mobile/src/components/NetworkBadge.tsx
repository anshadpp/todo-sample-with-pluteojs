import React from "react";
import {View, Text, StyleSheet} from "react-native";
import {useNetwork} from "../context/NetworkContext";

export default function NetworkBadge() {
	const {isConnected, pendingSync} = useNetwork();

	return (
		<View style={styles.container}>
			<View
				style={[
					styles.dot,
					{backgroundColor: isConnected ? "#22C55E" : "#EF4444"},
				]}
			/>
			{pendingSync > 0 && (
				<View style={styles.badge}>
					<Text style={styles.badgeText}>{pendingSync}</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	badge: {
		backgroundColor: "#F59E0B",
		borderRadius: 8,
		paddingHorizontal: 5,
		paddingVertical: 1,
		minWidth: 18,
		alignItems: "center",
	},
	badgeText: {
		color: "#FFFFFF",
		fontSize: 10,
		fontWeight: "700",
	},
});
