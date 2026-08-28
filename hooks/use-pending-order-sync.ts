import { useCallback, useEffect } from "react";
import { AppState, Platform } from "react-native";
import * as Network from "expo-network";

import { registerPendingOrderSyncTask } from "@/lib/background-order-sync";
import { syncPendingOrderChanges } from "@/lib/pending-order-sync";

export function usePendingOrderSync(accountId?: number, onSynced?: () => void | Promise<unknown>) {
  const sync = useCallback(async () => {
    if (!accountId) return { synced: 0, pending: 0 };
    const result = await syncPendingOrderChanges(accountId);
    if (result.synced > 0) await onSynced?.();
    return result;
  }, [accountId, onSynced]);

  useEffect(() => {
    if (!accountId) return;
    void registerPendingOrderSyncTask().catch(() => undefined);
    void sync().catch(() => undefined);

    const networkSubscription = Network.addNetworkStateListener((state) => {
      if (state.isInternetReachable ?? state.isConnected) void sync().catch(() => undefined);
    });
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void sync().catch(() => undefined);
    });

    return () => {
      networkSubscription.remove();
      appStateSubscription.remove();
    };
  }, [accountId, sync]);

  return { sync, isSupported: Platform.OS !== "web" };
}
