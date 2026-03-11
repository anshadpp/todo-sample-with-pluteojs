import React from "react";
import {StatusBar, View} from "react-native";
import {NavigationContainer} from "@react-navigation/native";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import {Text} from "react-native";

import {AuthProvider} from "./src/context/AuthContext";
import {NetworkProvider} from "./src/context/NetworkContext";
import SyncBanner from "./src/components/SyncBanner";

import ProjectsScreen from "./src/screens/ProjectsScreen";
import TasksScreen from "./src/screens/TasksScreen";
import TaskDetailScreen from "./src/screens/TaskDetailScreen";
import SyncScreen from "./src/screens/SyncScreen";
import AccountScreen from "./src/screens/AccountScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ProjectStack() {
	return (
		<Stack.Navigator screenOptions={{headerShown: false}}>
			<Stack.Screen name="ProjectsList" component={ProjectsScreen} />
			<Stack.Screen name="Tasks" component={TasksScreen} />
			<Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
		</Stack.Navigator>
	);
}

function TabIcon({label, focused}: {label: string; focused: boolean}) {
	const icons: Record<string, string> = {
		Projects: "📁",
		Sync: "🔄",
		Account: "👤",
	};
	return (
		<View style={{alignItems: "center", gap: 2}}>
			<Text style={{fontSize: 20}}>{icons[label] || "📦"}</Text>
			<Text
				style={{
					fontSize: 10,
					color: focused ? "#3B82F6" : "#64748B",
					fontWeight: "600",
				}}
			>
				{label}
			</Text>
		</View>
	);
}

function MainTabs() {
	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: "#0F172A",
					borderTopColor: "#1E293B",
					height: 70,
					paddingBottom: 10,
				},
				tabBarShowLabel: false,
			}}
		>
			<Tab.Screen
				name="Projects"
				component={ProjectStack}
				options={{
					tabBarIcon: ({focused}: {focused: boolean}) => (
						<TabIcon label="Projects" focused={focused} />
					),
				}}
			/>
			<Tab.Screen
				name="Sync"
				component={SyncScreen}
				options={{
					tabBarIcon: ({focused}: {focused: boolean}) => (
						<TabIcon label="Sync" focused={focused} />
					),
				}}
			/>
			<Tab.Screen
				name="Account"
				component={AccountScreen}
				options={{
					tabBarIcon: ({focused}: {focused: boolean}) => (
						<TabIcon label="Account" focused={focused} />
					),
				}}
			/>
		</Tab.Navigator>
	);
}

export default function App() {
	return (
		<AuthProvider>
			<NetworkProvider>
				<StatusBar barStyle="light-content" backgroundColor="#0F172A" />
				<SyncBanner />
				<NavigationContainer>
					<MainTabs />
				</NavigationContainer>
			</NetworkProvider>
		</AuthProvider>
	);
}
