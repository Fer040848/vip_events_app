import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";

const MEDALS = ["🥇", "🥈", "🥉"];
const CROWN_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"chat" | "events">("chat");

  const { data: chatMessages, isLoading: loadingChat } = trpc.chat.messages.useQuery({ afterId: undefined });
  const { data: invitations, isLoading: loadingInv } = trpc.invitations.myInvitations.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: presence } = trpc.chat.onlineUsers.useQuery(undefined, {
    refetchInterval: 30000,
  });

  // Build chat leaderboard from messages
  const chatLeaderboard = (() => {
    if (!chatMessages) return [];
    const counts: Record<string, { name: string; code: string; count: number; isAdmin: boolean }> = {};
    for (const msg of chatMessages) {
      const key = msg.userCode ?? msg.userId.toString();
      if (!counts[key]) {
        counts[key] = {
          name: msg.userName ?? "Invitado",
          code: msg.userCode ?? "",
          count: 0,
          isAdmin: msg.isAdmin ?? false,
        };
      }
      counts[key].count++;
    }
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 20);
  })();

  // Online users
  const onlineUsers = (presence ?? []).filter((p: any) => p.isOnline);
  const isLoading = loadingChat || loadingInv;

  const myCode = (user as any)?.openId?.replace("code_", "") ?? "";
  const myRankChat = chatLeaderboard.findIndex((u) => u.code === myCode);

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Comunidad VIP</Text>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{onlineUsers.length} en línea</Text>
          </View>
        </View>

        {/* Tab selector */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "chat" && styles.tabActive]}
            onPress={() => setActiveTab("chat")}
          >
            <Text style={[styles.tabText, activeTab === "chat" && styles.tabTextActive]}>
              💬 Más activos en chat
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "events" && styles.tabActive]}
            onPress={() => setActiveTab("events")}
          >
            <Text style={[styles.tabText, activeTab === "events" && styles.tabTextActive]}>
              🌐 Conectados ahora
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#C9A84C" />
          </View>
        ) : activeTab === "chat" ? (
          <FlatList
            data={chatLeaderboard}
            keyExtractor={(item, idx) => `${item.code}-${idx}`}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              myRankChat >= 0 ? (
                <View style={styles.myRankCard}>
                  <Text style={styles.myRankLabel}>Tu posición en el ranking</Text>
                  <Text style={styles.myRankNumber}>#{myRankChat + 1}</Text>
                  <Text style={styles.myRankMessages}>
                    {chatLeaderboard[myRankChat]?.count ?? 0} mensajes enviados
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyTitle}>Sin actividad aún</Text>
                <Text style={styles.emptySubtitle}>¡Sé el primero en chatear y aparecer en el ranking!</Text>
              </View>
            }
            renderItem={({ item, index }) => {
              const isMe = item.code === myCode;
              const medal = MEDALS[index];
              const crownColor = CROWN_COLORS[index];
              return (
                <View style={[styles.rankCard, isMe && styles.rankCardMe]}>
                  <View style={styles.rankLeft}>
                    {medal ? (
                      <Text style={styles.medalText}>{medal}</Text>
                    ) : (
                      <View style={styles.rankNumContainer}>
                        <Text style={styles.rankNum}>#{index + 1}</Text>
                      </View>
                    )}
                    <View style={[styles.avatarCircle, crownColor ? { borderColor: crownColor } : {}]}>
                      <Text style={styles.avatarText}>
                        {item.name[0]?.toUpperCase() ?? "V"}
                      </Text>
                    </View>
                    <View style={styles.rankInfo}>
                      <View style={styles.rankNameRow}>
                        <Text style={[styles.rankName, isMe && styles.rankNameMe]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {item.isAdmin && (
                          <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>ADMIN</Text>
                          </View>
                        )}
                        {isMe && (
                          <View style={styles.meBadge}>
                            <Text style={styles.meBadgeText}>TÚ</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.rankCode}>{item.code}</Text>
                    </View>
                  </View>
                  <View style={styles.rankRight}>
                    <Text style={[styles.rankCount, crownColor ? { color: crownColor } : {}]}>
                      {item.count}
                    </Text>
                    <Text style={styles.rankCountLabel}>msgs</Text>
                  </View>
                </View>
              );
            }}
          />
        ) : (
          <FlatList
            data={onlineUsers}
            keyExtractor={(item) => item.userId.toString()}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🌐</Text>
                <Text style={styles.emptyTitle}>Nadie conectado</Text>
                <Text style={styles.emptySubtitle}>Cuando los invitados abran la app, aparecerán aquí</Text>
              </View>
            }
            ListHeaderComponent={
              <Text style={styles.onlineHeader}>
                {onlineUsers.length} invitado{onlineUsers.length !== 1 ? "s" : ""} conectado{onlineUsers.length !== 1 ? "s" : ""} ahora
              </Text>
            }
            renderItem={({ item }) => {
              const isMe = item.userId === user?.id;
              return (
                <View style={[styles.onlineCard, isMe && styles.rankCardMe]}>
                  <View style={styles.onlineLeft}>
                    <View style={styles.onlineDotLarge} />
                    <View style={[styles.avatarCircle, { borderColor: "#27AE60" }]}>
                      <Text style={styles.avatarText}>
                        {item.userName?.[0]?.toUpperCase() ?? "V"}
                      </Text>
                    </View>
                    <View>
                      <View style={styles.rankNameRow}>
                        <Text style={[styles.rankName, isMe && styles.rankNameMe]} numberOfLines={1}>
                          {item.userName ?? "Invitado"}
                        </Text>
                        {item.isAdmin && (
                          <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>ADMIN</Text>
                          </View>
                        )}
                        {isMe && (
                          <View style={styles.meBadge}>
                            <Text style={styles.meBadgeText}>TÚ</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.rankCode}>{item.userCode}</Text>
                    </View>
                  </View>
                  <Text style={styles.onlineTime}>
                    {new Date(item.lastSeenAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              );
            }}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F5E6C8",
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#27AE6022",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#27AE6044",
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#27AE60",
  },
  onlineText: {
    color: "#27AE60",
    fontSize: 12,
    fontWeight: "700",
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  tabActive: {
    backgroundColor: "#C9A84C22",
    borderColor: "#C9A84C",
  },
  tabText: {
    color: "#8A7A5A",
    fontSize: 12,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#C9A84C",
  },
  myRankCard: {
    backgroundColor: "#C9A84C11",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C9A84C33",
    marginBottom: 16,
    gap: 4,
  },
  myRankLabel: {
    fontSize: 11,
    color: "#8A7A5A",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  myRankNumber: {
    fontSize: 36,
    fontWeight: "800",
    color: "#C9A84C",
  },
  myRankMessages: {
    fontSize: 12,
    color: "#8A7A5A",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#8A7A5A",
    textAlign: "center",
    lineHeight: 20,
  },
  rankCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  rankCardMe: {
    borderColor: "#C9A84C",
    backgroundColor: "#C9A84C11",
  },
  rankLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  medalText: {
    fontSize: 24,
    width: 32,
    textAlign: "center",
  },
  rankNumContainer: {
    width: 32,
    alignItems: "center",
  },
  rankNum: {
    fontSize: 13,
    color: "#8A7A5A",
    fontWeight: "700",
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#C9A84C44",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#C9A84C",
  },
  rankInfo: {
    flex: 1,
    gap: 2,
  },
  rankNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  rankName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  rankNameMe: {
    color: "#C9A84C",
  },
  adminBadge: {
    backgroundColor: "#C9A84C22",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adminBadgeText: {
    color: "#C9A84C",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  meBadge: {
    backgroundColor: "#3498DB22",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  meBadgeText: {
    color: "#3498DB",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  rankCode: {
    fontSize: 10,
    color: "#8A7A5A",
    fontFamily: "monospace",
  },
  rankRight: {
    alignItems: "center",
  },
  rankCount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#8A7A5A",
  },
  rankCountLabel: {
    fontSize: 10,
    color: "#555",
  },
  onlineHeader: {
    fontSize: 13,
    color: "#8A7A5A",
    marginBottom: 8,
    textAlign: "center",
  },
  onlineCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  onlineLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  onlineDotLarge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#27AE60",
  },
  onlineTime: {
    fontSize: 11,
    color: "#8A7A5A",
  },
});
