import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(__dirname, "..");
const readSource = (path: string) => readFileSync(resolve(projectRoot, path), "utf8");

describe("contrato de push para el chat general", () => {
  it("notifica los mensajes confirmados sin incluir el token del remitente", () => {
    const router = readSource("server/routers.ts");
    const db = readSource("server/db.ts");

    expect(db).toContain("getPushTokensExcludingUser");
    expect(router).toContain("sendChatPushNotifications(ctx.user.id");
    expect(router).toContain("channelId: \"afterroom_chat\"");
    expect(router).toContain("type: \"chat_message\"");
  });

  it("declara los plugins y registra el token desde un único punto global", () => {
    const config = readSource("app.config.ts");
    const rootLayout = readSource("app/_layout.tsx");
    const chat = readSource("app/(tabs)/chat.tsx");

    expect(config).toContain('"expo-background-task"');
    expect(config).toContain('"expo-notifications"');
    expect(rootLayout).toContain("const { notification, dismissNotification } = useNotifications");
    expect(rootLayout).toContain("onChatNotificationOpen: openChatFromNotification");
    expect(chat).not.toContain('projectId: "vip-events-app"');
  });

  it("permite abrir exclusivamente el chat cuando el usuario toca su aviso push", () => {
    const notificationHook = readSource("hooks/use-notifications.ts");
    const rootLayout = readSource("app/_layout.tsx");
    const tabLayout = readSource("app/(tabs)/_layout.tsx");
    const chat = readSource("app/(tabs)/chat.tsx");

    expect(notificationHook).toContain("getChatNotificationRoute");
    expect(notificationHook).toContain("addNotificationResponseReceivedListener");
    expect(notificationHook).toContain("getLastNotificationResponseAsync");
    expect(rootLayout).toContain("onChatNotificationOpen: openChatFromNotification");
    expect(rootLayout).toContain("params: messageId ? { highlight: String(messageId) } : {}");
    expect(rootLayout).toContain("<ChatNotificationBanner");
    expect(tabLayout).toContain("useChatUnreadCount(user?.id)");
    expect(tabLayout).toContain("tabBarBadge: unreadCount > 0 ? unreadCount : undefined");
    expect(chat).toContain("useLocalSearchParams<{ highlight?: string }>()");
    expect(chat).toContain("styles.bubbleHighlighted");
  });
});
