import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useRef,
	useCallback,
	type ReactNode,
} from "react";
import NetInfo from "@react-native-community/netinfo";
import {
	processSyncQueue,
	getPendingSyncCount,
	type SyncResult,
} from "../services/offlineSync";

interface NetworkContextType {
	isConnected: boolean;
	pendingSync: number;
	lastSyncResult: SyncResult | null;
	syncNow: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType>({
	isConnected: true,
	pendingSync: 0,
	lastSyncResult: null,
	syncNow: async () => {},
});

export function NetworkProvider({children}: {children: ReactNode}) {
	const [isConnected, setIsConnected] = useState(true);
	const [pendingSync, setPendingSync] = useState(0);
	const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
	const wasOffline = useRef(false);

	const refreshPendingCount = useCallback(async () => {
		const count = await getPendingSyncCount();
		setPendingSync(count);
	}, []);

	const syncNow = useCallback(async () => {
		const result = await processSyncQueue();
		setLastSyncResult(result);
		await refreshPendingCount();
	}, [refreshPendingCount]);

	useEffect(() => {
		const unsubscribe = NetInfo.addEventListener((state) => {
			const connected = state.isConnected ?? false;
			setIsConnected(connected);

			if (!connected) {
				wasOffline.current = true;
			}

			// Auto-sync when coming back online
			if (connected && wasOffline.current) {
				wasOffline.current = false;
				syncNow();
			}
		});

		// Check initial pending count
		refreshPendingCount();

		return () => unsubscribe();
	}, [syncNow, refreshPendingCount]);

	return (
		<NetworkContext.Provider
			value={{isConnected, pendingSync, lastSyncResult, syncNow}}
		>
			{children}
		</NetworkContext.Provider>
	);
}

export const useNetwork = () => useContext(NetworkContext);
