import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://10.0.2.2:3020"; // Android emulator -> localhost
// Use "http://localhost:3020" for iOS simulator

export async function getApiBase(): Promise<string> {
	const custom = await AsyncStorage.getItem("@pluteo/api_base");
	return custom || API_BASE;
}

export async function getAuthCookie(): Promise<string> {
	return (await AsyncStorage.getItem("@pluteo/cookie")) || "";
}

export async function apiFetch<T>(
	path: string,
	options?: RequestInit
): Promise<{isSuccess: boolean; data: T | null; error: any}> {
	const base = await getApiBase();
	const cookie = await getAuthCookie();
	try {
		const res = await fetch(`${base}${path}`, {
			headers: {
				"Content-Type": "application/json",
				Cookie: cookie,
				Origin: "http://localhost:4020",
				...(options?.headers || {}),
			},
			...options,
		});
		const json = await res.json();
		return {
			isSuccess: json.isSuccess ?? false,
			data: json.data ?? null,
			error: json.error ?? null,
		};
	} catch (err) {
		return {isSuccess: false, data: null, error: err};
	}
}

// Auth helpers
export async function signIn(
	email: string,
	password: string
): Promise<boolean> {
	const base = await getApiBase();
	try {
		const res = await fetch(`${base}/api/v1/auth/sign-in/email`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Origin: "http://localhost:4020",
			},
			body: JSON.stringify({email, password}),
		});
		const setCookie = res.headers.get("set-cookie");
		if (setCookie) {
			const cookie = setCookie.split(";")[0];
			await AsyncStorage.setItem("@pluteo/cookie", cookie);
		}
		const json = await res.json();
		if (json.token || json.user) {
			await AsyncStorage.setItem("@pluteo/user", JSON.stringify(json.user));
			return true;
		}
		return false;
	} catch {
		return false;
	}
}

export async function signUp(
	name: string,
	email: string,
	password: string
): Promise<boolean> {
	const base = await getApiBase();
	try {
		const res = await fetch(`${base}/api/v1/auth/sign-up/email`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Origin: "http://localhost:4020",
			},
			body: JSON.stringify({name, email, password}),
		});
		const setCookie = res.headers.get("set-cookie");
		if (setCookie) {
			const cookie = setCookie.split(";")[0];
			await AsyncStorage.setItem("@pluteo/cookie", cookie);
		}
		const json = await res.json();
		if (json.token || json.user) {
			await AsyncStorage.setItem("@pluteo/user", JSON.stringify(json.user));
			return true;
		}
		return false;
	} catch {
		return false;
	}
}

export async function signOut(): Promise<void> {
	await AsyncStorage.multiRemove(["@pluteo/cookie", "@pluteo/user"]);
}
