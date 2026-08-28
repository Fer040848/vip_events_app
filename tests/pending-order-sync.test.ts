import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = new Map<string, string>();
const { mutate, networkState } = vi.hoisted(() => ({
  mutate: vi.fn(),
  networkState: { isInternetReachable: true, isConnected: true },
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
  },
}));

vi.mock("expo-network", () => ({
  getNetworkStateAsync: vi.fn(async () => networkState),
}));

vi.mock("@/lib/trpc", () => ({
  createTRPCClient: () => ({
    vipOrders: { updateStatus: { mutate } },
  }),
}));

import {
  getPendingOrderChanges,
  parsePendingOrderChanges,
  queueOrderStatusChange,
  syncPendingOrderChanges,
} from "@/lib/pending-order-sync";

describe("cola de sincronización de pedidos", () => {
  beforeEach(() => {
    storage.clear();
    mutate.mockReset();
    networkState.isInternetReachable = true;
    networkState.isConnected = true;
  });

  it("conserva sólo el cambio más reciente de cada pedido", async () => {
    await queueOrderStatusChange(4, { orderId: 12, status: "confirmed" });
    await queueOrderStatusChange(4, { orderId: 12, status: "delivered" });

    await expect(getPendingOrderChanges(4)).resolves.toEqual([
      expect.objectContaining({ orderId: 12, status: "delivered" }),
    ]);
  });

  it("envía los cambios pendientes y mantiene en cola únicamente los que fallen", async () => {
    await queueOrderStatusChange(4, { orderId: 12, status: "confirmed" });
    await queueOrderStatusChange(4, { orderId: 13, status: "cancelled" });
    mutate.mockImplementation(async ({ id }: { id: number }) => {
      if (id === 13) throw new Error("red interrumpida");
    });

    await expect(syncPendingOrderChanges(4)).resolves.toEqual({ synced: 1, pending: 1 });
    await expect(getPendingOrderChanges(4)).resolves.toEqual([
      expect.objectContaining({ orderId: 13, status: "cancelled" }),
    ]);
  });

  it("no intenta enviar la cola si la red no puede alcanzar internet", async () => {
    await queueOrderStatusChange(4, { orderId: 12, status: "confirmed" });
    networkState.isInternetReachable = false;

    await expect(syncPendingOrderChanges(4)).resolves.toEqual({ synced: 0, pending: 1 });
    expect(mutate).not.toHaveBeenCalled();
  });

  it("descarta entradas corruptas de la cola", () => {
    expect(parsePendingOrderChanges("[{")).toEqual([]);
    expect(parsePendingOrderChanges('[{"orderId":"x","status":"pending"}]')).toEqual([]);
  });
});
