export const CHAT_NOTIFICATION_ROUTE = "/(tabs)/chat";

export type ChatNotificationIntent = {
  route: typeof CHAT_NOTIFICATION_ROUTE;
  messageId?: number;
};

export function getChatNotificationIntent(data: unknown): ChatNotificationIntent | null {
  if (!data || typeof data !== "object") return null;
  const payload = data as { type?: unknown; url?: unknown; messageId?: unknown };
  if (payload.type !== "chat_message" || payload.url !== CHAT_NOTIFICATION_ROUTE) return null;

  const numericMessageId = Number(payload.messageId);
  return {
    route: CHAT_NOTIFICATION_ROUTE,
    messageId: Number.isSafeInteger(numericMessageId) && numericMessageId > 0
      ? numericMessageId
      : undefined,
  };
}
