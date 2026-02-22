import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import * as Haptics from "expo-haptics";

type ChatMessage = {
  id: number;
  userId: number;
  userName: string;
  userCode: string;
  isAdmin: boolean;
  message: string;
  createdAt: Date | string;
};

type OnlineUser = {
  id: number;
  userId: number;
  userName: string;
  userCode: string;
  isAdmin: boolean;
  isOnline: boolean;
  lastSeenAt: Date | string;
};

export default function ChatScreen() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [showOnline, setShowOnline] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastId, setLastId] = useState<number | undefined>(undefined);
  const flatListRef = useRef<FlatList>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch messages
  const { data: initialMessages, isLoading } = trpc.chat.messages.useQuery(
    { afterId: undefined },
    { enabled: !!user }
  );

  // Online users
  const { data: onlineUsers, refetch: refetchOnline } = trpc.chat.onlineUsers.useQuery(
    undefined,
    { enabled: !!user, refetchInterval: 15000 }
  );

  // Send message mutation
  const sendMutation = trpc.chat.send.useMutation();

  // Heartbeat mutation
  const heartbeatMutation = trpc.chat.heartbeat.useMutation();

  // Offline mutation
  const offlineMutation = trpc.chat.offline.useMutation();

  // Fetch new messages polling
  const fetchNewMessages = useCallback(async () => {
    if (!user) return;
    try {
      // We use a direct query approach via utils
    } catch (e) {
      // ignore
    }
  }, [user, lastId]);

  // Initialize messages
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages as ChatMessage[]);
      const last = initialMessages[initialMessages.length - 1];
      setLastId(last.id);
    }
  }, [initialMessages]);

  // Heartbeat every 30s
  useEffect(() => {
    if (!user) return;
    heartbeatMutation.mutate();
    heartbeatRef.current = setInterval(() => {
      heartbeatMutation.mutate();
    }, 30000);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      offlineMutation.mutate();
    };
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text || !user) return;

    setMessage("");

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Optimistic update
    const tempMsg: ChatMessage = {
      id: Date.now(),
      userId: user.id,
      userName: user.name ?? "Yo",
      userCode: user.openId?.replace("code_", "") ?? "",
      isAdmin: false,
      message: text,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const newId = await sendMutation.mutateAsync({ message: text });
      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsg.id ? { ...m, id: newId as number } : m))
      );
      setLastId(newId as number);
    } catch (e) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    }
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  };

  const isMyMessage = (msg: ChatMessage) => user && msg.userId === user.id;

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMine = isMyMessage(item);
    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isMine && (
          <View style={[styles.avatar, item.isAdmin ? styles.avatarAdmin : styles.avatarUser]}>
            <Text style={styles.avatarText}>
              {item.userName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          {!isMine && (
            <View style={styles.bubbleHeader}>
              <Text style={[styles.bubbleName, item.isAdmin ? styles.bubbleNameAdmin : null]}>
                {item.userName}
              </Text>
              {item.isAdmin && <Text style={styles.adminBadge}>ADMIN</Text>}
            </View>
          )}
          <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : null]}>
            {item.message}
          </Text>
          <Text style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : null]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        {isMine && (
          <View style={[styles.avatar, styles.avatarMine]}>
            <Text style={styles.avatarText}>
              {(user?.name ?? "Y").charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const onlineCount = onlineUsers?.length ?? 0;

  return (
    <ScreenContainer containerClassName="bg-black" edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>💬 Chat VIP</Text>
          <Text style={styles.headerSub}>Centro de comunicación exclusivo</Text>
        </View>
        <TouchableOpacity
          style={styles.onlineBtn}
          onPress={() => { setShowOnline(true); refetchOnline(); }}
          activeOpacity={0.8}
        >
          <View style={styles.onlineDot} />
          <Text style={styles.onlineBtnText}>{onlineCount} en línea</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Messages */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#C9A84C" size="large" />
            <Text style={styles.loadingText}>Cargando mensajes...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyTitle}>¡Sé el primero en escribir!</Text>
                <Text style={styles.emptySubtitle}>
                  Este es el chat exclusivo para invitados VIP.
                </Text>
              </View>
            }
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#555"
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !message.trim() ? styles.sendBtnDisabled : null]}
            onPress={handleSend}
            disabled={!message.trim() || sendMutation.isPending}
            activeOpacity={0.8}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Online Users Modal */}
      <Modal
        visible={showOnline}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOnline(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOnline(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Usuarios en línea</Text>
            <Text style={styles.modalSub}>{onlineCount} conectados ahora</Text>
            {!onlineUsers || onlineUsers.length === 0 ? (
              <Text style={styles.noOnline}>No hay usuarios conectados en este momento.</Text>
            ) : (
              <FlatList
                data={onlineUsers as OnlineUser[]}
                keyExtractor={(item) => item.userId.toString()}
                renderItem={({ item }) => (
                  <View style={styles.onlineUserRow}>
                    <View style={[styles.onlineAvatar, item.isAdmin ? styles.onlineAvatarAdmin : null]}>
                      <Text style={styles.onlineAvatarText}>
                        {item.userName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.onlineUserInfo}>
                      <View style={styles.onlineUserNameRow}>
                        <Text style={styles.onlineUserName}>{item.userName}</Text>
                        {item.isAdmin && <Text style={styles.adminBadge}>ADMIN</Text>}
                      </View>
                      <Text style={styles.onlineUserCode}>{item.userCode}</Text>
                    </View>
                    <View style={styles.onlineDotSmall} />
                  </View>
                )}
                style={styles.onlineList}
              />
            )}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowOnline(false)}
            >
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e1e",
    backgroundColor: "#000",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#C9A84C",
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  onlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#222",
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  onlineBtnText: {
    fontSize: 12,
    color: "#ccc",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#666",
    fontSize: 14,
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
    gap: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 4,
  },
  msgRowLeft: {
    justifyContent: "flex-start",
  },
  msgRowRight: {
    justifyContent: "flex-end",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarAdmin: {
    backgroundColor: "#2a1a00",
    borderWidth: 1.5,
    borderColor: "#C9A84C",
  },
  avatarUser: {
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#333",
  },
  avatarMine: {
    backgroundColor: "#0a2a1a",
    borderWidth: 1,
    borderColor: "#22C55E",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 12,
  },
  bubbleMine: {
    backgroundColor: "#0d2a1a",
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: "#1a4a2a",
  },
  bubbleOther: {
    backgroundColor: "#111",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#222",
  },
  bubbleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  bubbleName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#888",
  },
  bubbleNameAdmin: {
    color: "#C9A84C",
  },
  adminBadge: {
    fontSize: 9,
    color: "#C9A84C",
    backgroundColor: "#1a1200",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    fontWeight: "700",
    letterSpacing: 0.5,
    borderWidth: 1,
    borderColor: "#C9A84C",
    overflow: "hidden",
  },
  bubbleText: {
    fontSize: 14,
    color: "#ddd",
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: "#e8f5e9",
  },
  bubbleTime: {
    fontSize: 10,
    color: "#555",
    marginTop: 4,
    textAlign: "right",
  },
  bubbleTimeMine: {
    color: "#4a7a5a",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    borderTopWidth: 1,
    borderTopColor: "#1e1e1e",
    backgroundColor: "#000",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#fff",
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#222",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C9A84C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: "#333",
    shadowOpacity: 0,
  },
  sendIcon: {
    fontSize: 16,
    color: "#000",
    fontWeight: "700",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#111",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "70%",
    borderTopWidth: 1,
    borderColor: "#2a2200",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: "#888",
    marginBottom: 16,
  },
  noOnline: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  onlineList: {
    maxHeight: 300,
  },
  onlineUserRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e1e",
    gap: 12,
  },
  onlineAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  onlineAvatarAdmin: {
    backgroundColor: "#2a1a00",
    borderColor: "#C9A84C",
  },
  onlineAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  onlineUserInfo: {
    flex: 1,
  },
  onlineUserNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  onlineUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  onlineUserCode: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  onlineDotSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
  },
  closeBtn: {
    backgroundColor: "#222",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  closeBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
