import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";

import { DEFAULT_CHAT_PREFERENCES, normalizeChatPreferences } from "@/lib/chat-preferences";

const PREFERENCES_PREFIX = "@afterroom_chat_preferences_v1";

type ChatPreferencesContextValue = {
  bannersEnabled: boolean;
  isReady: boolean;
  setBannersEnabled: (enabled: boolean) => void;
};

const ChatPreferencesContext = createContext<ChatPreferencesContextValue | null>(null);

function storageKey(accountId: number) {
  return `${PREFERENCES_PREFIX}:${accountId}`;
}

export function ChatPreferencesProvider({ accountId, children }: { accountId?: number; children: ReactNode }) {
  const [bannersEnabled, setBannersEnabledState] = useState(DEFAULT_CHAT_PREFERENCES.bannersEnabled);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    setIsReady(false);
    setBannersEnabledState(DEFAULT_CHAT_PREFERENCES.bannersEnabled);
    if (!accountId) {
      setIsReady(true);
      return;
    }

    AsyncStorage.getItem(storageKey(accountId))
      .then((raw) => {
        if (!active) return;
        const parsed = raw ? JSON.parse(raw) : null;
        setBannersEnabledState(normalizeChatPreferences(parsed).bannersEnabled);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setIsReady(true);
      });

    return () => { active = false; };
  }, [accountId]);

  const setBannersEnabled = useCallback((enabled: boolean) => {
    setBannersEnabledState(enabled);
    if (accountId) {
      void AsyncStorage.setItem(storageKey(accountId), JSON.stringify({ bannersEnabled: enabled })).catch(() => undefined);
    }
  }, [accountId]);

  return (
    <ChatPreferencesContext.Provider value={{ bannersEnabled, isReady, setBannersEnabled }}>
      {children}
    </ChatPreferencesContext.Provider>
  );
}

export function useChatPreferences() {
  const value = useContext(ChatPreferencesContext);
  if (!value) throw new Error("useChatPreferences debe usarse dentro de ChatPreferencesProvider");
  return value;
}
