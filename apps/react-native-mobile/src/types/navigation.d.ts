// Fix React types mismatch in monorepo between react-navigation and @types/react
import "@react-navigation/native";
import "@react-navigation/native-stack";
import "@react-navigation/bottom-tabs";

declare module "@react-navigation/native" {
	export function NavigationContainer(props: any): React.JSX.Element;
}

declare module "@react-navigation/native-stack" {
	export function createNativeStackNavigator(): {
		Navigator: React.ComponentType<any>;
		Screen: React.ComponentType<any>;
		Group: React.ComponentType<any>;
	};
}

declare module "@react-navigation/bottom-tabs" {
	export function createBottomTabNavigator(): {
		Navigator: React.ComponentType<any>;
		Screen: React.ComponentType<any>;
		Group: React.ComponentType<any>;
	};
}
