import { describe, expect, it } from "vitest";

import { CHAT_NOTIFICATION_ROUTE, getChatNotificationIntent } from "@/lib/chat-notification-intent";
import { countUnreadChatMessages } from "@/lib/chat-unread";

describe("intención y estado visual de los avisos del chat", () => {
  it("acepta sólo el destino fijo del chat y conserva un identificador válido", () => {
    expect(getChatNotificationIntent({
      type: "chat_message",
      url: CHAT_NOTIFICATION_ROUTE,
      messageId: "42",
    })).toEqual({ route: CHAT_NOTIFICATION_ROUTE, messageId: 42 });
  });

  it("rechaza destinos o tipos de notificación no autorizados", () => {
    expect(getChatNotificationIntent({ type: "payment", url: CHAT_NOTIFICATION_ROUTE })).toBeNull();
    expect(getChatNotificationIntent({ type: "chat_message", url: "/admin" })).toBeNull();
  });

  it("cuenta sólo mensajes ajenos posteriores al último mensaje leído", () => {
    expect(countUnreadChatMessages([
      { id: 6, userId: 1 },
      { id: 7, userId: 3 },
      { id: 8, userId: 2 },
    ], 6, 2)).toBe(1);
  });
});
