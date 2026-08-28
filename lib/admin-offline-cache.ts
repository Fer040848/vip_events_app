import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";

const CACHE_PREFIX = "@afterroom_admin_cache_v1";

export type OfflineSnapshot<T> = {
  savedAt: string;
  data: T;
};

function cacheKey(accountId: number, scope: string) {
  return `${CACHE_PREFIX}:${accountId}:${scope}`;
}

export function parseOfflineSnapshot<T>(raw: string | null): OfflineSnapshot<T> | null {
  if (!raw) return null;

  try {
    const snapshot = JSON.parse(raw) as OfflineSnapshot<T>;
    if (!snapshot || typeof snapshot.savedAt !== "string" || !("data" in snapshot)) return null;
    return snapshot;
  } catch {
    return null;
  }
}

export async function loadOfflineSnapshot<T>(accountId: number, scope: string) {
  const raw = await AsyncStorage.getItem(cacheKey(accountId, scope));
  return parseOfflineSnapshot<T>(raw);
}

export async function saveOfflineSnapshot<T>(accountId: number, scope: string, data: T) {
  const snapshot: OfflineSnapshot<T> = { savedAt: new Date().toISOString(), data };
  await AsyncStorage.setItem(cacheKey(accountId, scope), JSON.stringify(snapshot));
  return snapshot;
}

type OfflineCacheOptions<T> = {
  accountId?: number;
  scope: string;
  liveData?: T;
};

export function useAdminOfflineCache<T>({ accountId, scope, liveData }: OfflineCacheOptions<T>) {
  const [snapshot, setSnapshot] = useState<OfflineSnapshot<T> | null>(null);
  const [isCacheLoading, setIsCacheLoading] = useState(Boolean(accountId));

  useEffect(() => {
    let isMounted = true;

    if (!accountId) {
      setSnapshot(null);
      setIsCacheLoading(false);
      return;
    }

    setIsCacheLoading(true);
    void loadOfflineSnapshot<T>(accountId, scope)
      .then((cached) => {
        if (isMounted) setSnapshot(cached);
      })
      .catch(() => {
        if (isMounted) setSnapshot(null);
      })
      .finally(() => {
        if (isMounted) setIsCacheLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [accountId, scope]);

  useEffect(() => {
    if (!accountId || liveData === undefined) return;

    void saveOfflineSnapshot(accountId, scope, liveData)
      .then(setSnapshot)
      .catch(() => undefined);
  }, [accountId, liveData, scope]);

  return useMemo(
    () => ({
      cachedData: snapshot?.data,
      cachedAt: snapshot?.savedAt,
      isCacheLoading,
    }),
    [isCacheLoading, snapshot],
  );
}
