import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";

import { createTRPCClient } from "@/lib/trpc";

const QUEUE_PREFIX = "@afterroom_pending_order_status_v1";

export type PendingOrderStatusChange = {
  orderId: number;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  queuedAt: string;
};

function queueKey(accountId: number) {
  return `${QUEUE_PREFIX}:${accountId}`;
}

export function parsePendingOrderChanges(raw: string | null): PendingOrderStatusChange[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is PendingOrderStatusChange => (
      typeof entry === "object" && entry !== null
      && typeof (entry as PendingOrderStatusChange).orderId === "number"
      && ["pending", "confirmed", "delivered", "cancelled"].includes((entry as PendingOrderStatusChange).status)
      && typeof (entry as PendingOrderStatusChange).queuedAt === "string"
    ));
  } catch {
    return [];
  }
}

export async function getPendingOrderChanges(accountId: number) {
  return parsePendingOrderChanges(await AsyncStorage.getItem(queueKey(accountId)));
}

export async function queueOrderStatusChange(
  accountId: number,
  change: Omit<PendingOrderStatusChange, "queuedAt">,
) {
  const existing = await getPendingOrderChanges(accountId);
  const next: PendingOrderStatusChange = { ...change, queuedAt: new Date().toISOString() };
  const merged = [...existing.filter((queued) => queued.orderId !== change.orderId), next];
  await AsyncStorage.setItem(queueKey(accountId), JSON.stringify(merged));
  return merged;
}

export async function hasInternetConnection() {
  const state = await Network.getNetworkStateAsync();
  return state.isInternetReachable ?? state.isConnected ?? false;
}

export async function syncPendingOrderChanges(accountId: number) {
  if (!await hasInternetConnection()) return { synced: 0, pending: (await getPendingOrderChanges(accountId)).length };

  const pendingChanges = await getPendingOrderChanges(accountId);
  if (pendingChanges.length === 0) return { synced: 0, pending: 0 };

  const client = createTRPCClient();
  const remaining: PendingOrderStatusChange[] = [];
  let synced = 0;

  for (const change of pendingChanges) {
    try {
      await client.vipOrders.updateStatus.mutate({ id: change.orderId, status: change.status });
      synced += 1;
    } catch {
      remaining.push(change);
    }
  }

  await AsyncStorage.setItem(queueKey(accountId), JSON.stringify(remaining));
  return { synced, pending: remaining.length };
}
