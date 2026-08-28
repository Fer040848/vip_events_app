import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
  },
}));

import {
  loadOfflineSnapshot,
  parseOfflineSnapshot,
  saveOfflineSnapshot,
} from "@/lib/admin-offline-cache";

describe("caché administrativa sin conexión", () => {
  beforeEach(() => storage.clear());

  it("guarda y recupera un conjunto de datos bajo la cuenta y sección correctas", async () => {
    const payload = { orders: [{ id: 21, status: "pending" }] };

    const saved = await saveOfflineSnapshot(7, "vip-orders", payload);
    const restored = await loadOfflineSnapshot<typeof payload>(7, "vip-orders");
    const foreignAccount = await loadOfflineSnapshot<typeof payload>(8, "vip-orders");

    expect(saved.data).toEqual(payload);
    expect(restored?.data).toEqual(payload);
    expect(foreignAccount).toBeNull();
  });

  it("descarta una caché con formato inválido sin exponer datos corruptos", () => {
    expect(parseOfflineSnapshot("{datos-corruptos")).toBeNull();
    expect(parseOfflineSnapshot('{"savedAt":12,"data":[]}')).toBeNull();
  });
});
