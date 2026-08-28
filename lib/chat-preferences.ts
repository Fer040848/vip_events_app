export type ChatPreferences = {
  bannersEnabled: boolean;
};

export const DEFAULT_CHAT_PREFERENCES: ChatPreferences = {
  bannersEnabled: true,
};

export function normalizeChatPreferences(value: unknown): ChatPreferences {
  if (!value || typeof value !== "object") return DEFAULT_CHAT_PREFERENCES;
  const candidate = value as Partial<ChatPreferences>;
  return {
    bannersEnabled: typeof candidate.bannersEnabled === "boolean"
      ? candidate.bannersEnabled
      : DEFAULT_CHAT_PREFERENCES.bannersEnabled,
  };
}
