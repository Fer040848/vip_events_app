import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "expo-router";

import { trpc } from "@/lib/trpc";
import { countUnreadChatMessages, type UnreadChatMessage } from "@/lib/chat-unread";

const READ_MARKER_PREFIX = "@afterroom_chat_last_read_v1";

function readMarkerKey(userId: number) {
  return `${READ_MARKER_PREFIX}:${userId}`;
}

function isChatRoute(pathname: string) {
  return pathname === "/chat" || pathname === "/(tabs)/chat";
}

export function useChatUnreadCount(userId?: number) {
  const pathname = usePathname();
  const [lastReadMessageId, setLastReadMessageId] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const messagesQuery = trpc.chat.messages.useQuery(
    { afterId: undefined },
    { enabled: Boolean(userId), refetchInterval: 10_000 },
  );
  const messages = (messagesQuery.data ?? []) as UnreadChatMessage[];
  const chatIsOpen = isChatRoute(pathname);

  useEffect(() => {
    let mounted = true;
    setIsReady(false);
    setLastReadMessageId(0);
    if (!userId) return;

    AsyncStorage.getItem(readMarkerKey(userId))
      .then((stored) => {
        if (!mounted) return;
        const parsed = Number(stored);
        setLastReadMessageId(Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setIsReady(true);
      });

    return () => { mounted = false; };
  }, [userId]);

  const persistReadMarker = (messageId: number) => {
    if (!userId || messageId <= lastReadMessageId) return;
    setLastReadMessageId(messageId);
    void AsyncStorage.setItem(readMarkerKey(userId), String(messageId)).catch(() => undefined);
  };

  useEffect(() => {
    if (!userId || !isReady || messages.length === 0) return;
    const latestMessageId = messages[messages.length - 1]?.id ?? 0;
    if (!latestMessageId) return;

    // La primera consulta establece una base para no convertir el historial en no leído.
    if (lastReadMessageId === 0 || chatIsOpen) persistReadMarker(latestMessageId);
  }, [chatIsOpen, isReady, lastReadMessageId, messages, userId]);

  const unreadCount = useMemo(() => {
    if (!userId || !isReady || chatIsOpen) return 0;
    return countUnreadChatMessages(messages, lastReadMessageId, userId);
  }, [chatIsOpen, isReady, lastReadMessageId, messages, userId]);

  return { unreadCount, markChatRead: () => persistReadMarker(messages[messages.length - 1]?.id ?? 0) };
}
