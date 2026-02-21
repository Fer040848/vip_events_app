import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const { data: notifications, refetch: refetchNotifs } = trpc.notifications.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: myInvitations } = trpc.invitations.myInvitations.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => refetchNotifs(),
  });

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro de que deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login" as any);
        },
      },
    ]);
  };

  const handleMarkAllRead = () => {
    notifications?.forEach((n) => {
      markRead.mutate({ notificationId: n.id });
    });
  };

  const unreadCount = (unreadData as any)?.count ?? 0;
  const paidCount = myInvitations?.filter((i) => i.status === "paid" || i.status === "checked_in").length ?? 0;

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name[0].toUpperCase() : "V"}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name ?? "Invitado VIP"}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ""}</Text>
            <View style={styles.vipBadge}>
              <Text style={styles.vipBadgeText}>👑 MIEMBRO VIP</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{myInvitations?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Invitaciones</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{paidCount}</Text>
            <Text style={styles.statLabel}>Activas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{unreadCount}</Text>
            <Text style={styles.statLabel}>Notif. nuevas</Text>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Notificaciones {unreadCount > 0 && `(${unreadCount})`}
            </Text>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={handleMarkAllRead}>
                <Text style={styles.markAllRead}>Marcar todas leídas</Text>
              </TouchableOpacity>
            )}
          </View>

          {!notifications || notifications.length === 0 ? (
            <View style={styles.emptyNotif}>
              <Text style={styles.emptyNotifText}>Sin notificaciones</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.notifItem, styles.notifItemUnread]}
                  onPress={() => {
                    markRead.mutate({ notificationId: item.id });
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.notifContent}>
                  <View style={styles.notifTitleRow}>
                    <View style={styles.unreadDot} />
                    <Text style={styles.notifTitle}>{item.title}</Text>
                  </View>
                    <Text style={styles.notifBody} numberOfLines={3}>{item.body}</Text>
                    <Text style={styles.notifDate}>
                      {new Date(item.createdAt).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Actions */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push("/(tabs)/my-qr" as any)}
            >
              <Text style={styles.actionIcon}>🎫</Text>
              <Text style={styles.actionText}>Ver mis QR</Text>
              <Text style={styles.actionChevron}>›</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push("/(tabs)/events" as any)}
            >
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionText}>Calendario de eventos</Text>
              <Text style={styles.actionChevron}>›</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push("/(tabs)/vip-orders" as any)}
            >
              <Text style={styles.actionIcon}>👑</Text>
              <Text style={styles.actionText}>Mis pedidos VIP</Text>
              <Text style={styles.actionChevron}>›</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F5E6C8",
    letterSpacing: 0.5,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#C9A84C33",
    gap: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0A0A0A",
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  userEmail: {
    fontSize: 12,
    color: "#8A7A5A",
  },
  vipBadge: {
    backgroundColor: "#C9A84C22",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#C9A84C44",
    marginTop: 4,
  },
  vipBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#C9A84C",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#C9A84C",
  },
  statLabel: {
    fontSize: 10,
    color: "#8A7A5A",
    textAlign: "center",
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F5E6C8",
    marginBottom: 12,
  },
  markAllRead: {
    fontSize: 12,
    color: "#C9A84C",
    fontWeight: "600",
  },
  emptyNotif: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  emptyNotifText: {
    color: "#8A7A5A",
    fontSize: 13,
  },
  notifItem: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  notifItemUnread: {
    borderColor: "#C9A84C33",
    backgroundColor: "#C9A84C08",
  },
  notifContent: {
    gap: 6,
  },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#C9A84C",
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F5E6C8",
    flex: 1,
  },
  notifBody: {
    fontSize: 12,
    color: "#8A7A5A",
    lineHeight: 17,
  },
  notifDate: {
    fontSize: 10,
    color: "#8A7A5A",
    textTransform: "capitalize",
  },
  actionsCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    overflow: "hidden",
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: "#F5E6C8",
    fontWeight: "600",
  },
  actionChevron: {
    fontSize: 20,
    color: "#8A7A5A",
  },
  actionDivider: {
    height: 1,
    backgroundColor: "#2A2A2A",
    marginLeft: 52,
  },
  logoutBtn: {
    backgroundColor: "#C0392B22",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C0392B44",
  },
  logoutBtnText: {
    color: "#E74C3C",
    fontSize: 15,
    fontWeight: "700",
  },
});
