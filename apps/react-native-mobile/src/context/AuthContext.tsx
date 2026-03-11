import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	signIn as apiSignIn,
	signUp as apiSignUp,
	signOut as apiSignOut,
} from "../services/api";

interface User {
	id: string;
	name: string;
	email: string;
	image: string | null;
}

interface AuthContextType {
	user: User | null;
	loading: boolean;
	isLoggedIn: boolean;
	signIn: (email: string, password: string) => Promise<boolean>;
	signUp: (name: string, email: string, password: string) => Promise<boolean>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	loading: true,
	isLoggedIn: false,
	signIn: async () => false,
	signUp: async () => false,
	signOut: async () => {},
});

export function AuthProvider({children}: {children: ReactNode}) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			const raw = await AsyncStorage.getItem("@pluteo/user");
			const cookie = await AsyncStorage.getItem("@pluteo/cookie");
			if (raw && cookie) {
				setUser(JSON.parse(raw));
			}
			setLoading(false);
		})();
	}, []);

	const signIn = async (email: string, password: string) => {
		const ok = await apiSignIn(email, password);
		if (ok) {
			const raw = await AsyncStorage.getItem("@pluteo/user");
			if (raw) setUser(JSON.parse(raw));
		}
		return ok;
	};

	const signUp = async (name: string, email: string, password: string) => {
		const ok = await apiSignUp(name, email, password);
		if (ok) {
			const raw = await AsyncStorage.getItem("@pluteo/user");
			if (raw) setUser(JSON.parse(raw));
		}
		return ok;
	};

	const signOut = async () => {
		await apiSignOut();
		setUser(null);
	};

	return (
		<AuthContext.Provider
			value={{user, loading, isLoggedIn: !!user, signIn, signUp, signOut}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => useContext(AuthContext);
