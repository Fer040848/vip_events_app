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

export default function AdminDashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const { data: stats } = trpc.admin.stats.useQuery();
  const { data: events } = trpc.events.listAll.useQuery();
  const { data: users } = trpc.admin.users.useQuery();
  const { data: vipOrders } = trpc.vipOrders.getByEvent.useQuery(
    { eventId: 0 },
    { enabled: false }
  );

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Cerrar sesión de administrador?", [
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

  const recentEvents = events?.slice(0, 3) ?? [];
  const recentUsers = users?.slice(0, 5) ?? [];

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.adminBadge}>👑 PANEL ADMIN</Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>{user?.name ?? "Administrador"}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="👥"
            value={stats?.totalUsers ?? 0}
            label="Usuarios"
            color="#C9A84C"
          />
          <StatCard
            icon="🎉"
            value={stats?.totalEvents ?? 0}
            label="Eventos"
            color="#27AE60"
          />
          <StatCard
            icon="✅"
            value={stats?.publishedEvents ?? 0}
            label="Publicados"
            color="#3498DB"
          />
          <StatCard
            icon="🎫"
            value={users?.reduce((acc, u) => acc + ((u as any).invitationCount ?? 0), 0) ?? 0}
            label="Invitaciones"
            color="#9B59B6"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/(admin)/scan" as any)}
            >
              <Text style={styles.actionCardIcon}>📷</Text>
              <Text style={styles.actionCardText}>Escanear QR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/(admin)/events" as any)}
            >
              <Text style={styles.actionCardIcon}>➕</Text>
              <Text style={styles.actionCardText}>Crear Evento</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/(admin)/notifications" as any)}
            >
              <Text style={styles.actionCardIcon}>🔔</Text>
              <Text style={styles.actionCardText}>Enviar Notif</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/(admin)/guests" as any)}
            >
              <Text style={styles.actionCardIcon}>👥</Text>
              <Text style={styles.actionCardText}>Ver Invitados</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Eventos Recientes</Text>
            <TouchableOpacity onPress={() => router.push("/(admin)/events" as any)}>
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          {recentEvents.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No hay eventos aún</Text>
            </View>
          ) : (
            recentEvents.map((event) => (
              <View key={event.id} style={styles.eventRow}>
                <View style={styles.eventRowLeft}>
                  <Text style={styles.eventRowTitle} numberOfLines={1}>{event.title}</Text>
                  <Text style={styles.eventRowDate}>
                    {new Date(event.date).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.eventStatusBadge,
                    {
                      backgroundColor:
                        event.status === "published"
                          ? "#27AE6022"
                          : event.status === "draft"
                          ? "#F39C1222"
                          : "#C0392B22",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.eventStatusText,
                      {
                        color:
                          event.status === "published"
                            ? "#27AE60"
                            : event.status === "draft"
                            ? "#F39C12"
                            : "#C0392B",
                      },
                    ]}
                  >
                    {event.status === "published"
                      ? "Publicado"
                      : event.status === "draft"
                      ? "Borrador"
                      : event.status}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recent Users */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Usuarios Recientes</Text>
            <TouchableOpacity onPress={() => router.push("/(admin)/guests" as any)}>
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          {recentUsers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No hay usuarios aún</Text>
            </View>
          ) : (
            recentUsers.map((u) => (
              <View key={u.id} style={styles.userRow}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {u.name ? u.name[0].toUpperCase() : "?"}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.name ?? "Sin nombre"}</Text>
                  <Text style={styles.userEmail}>{u.email ?? ""}</Text>
                </View>
                <Text style={styles.userRole}>
                  {(u as any).role === "admin" ? "👑 Admin" : "👤 Usuario"}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderColor: `${color}33` }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  adminBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: "#C9A84C",
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F5E6C8",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#8A7A5A",
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: "#C0392B22",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#C0392B44",
    marginTop: 4,
  },
  logoutBtnText: {
    color: "#E74C3C",
    fontSize: 13,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "44%",
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  statIcon: {
    fontSize: 28,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    color: "#8A7A5A",
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
  seeAll: {
    fontSize: 13,
    color: "#C9A84C",
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: "44%",
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 8,
  },
  actionCardIcon: {
    fontSize: 30,
  },
  actionCardText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F5E6C8",
    textAlign: "center",
  },
  emptyCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  emptyText: {
    color: "#8A7A5A",
    fontSize: 13,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  eventRowLeft: {
    flex: 1,
    gap: 4,
    marginRight: 12,
  },
  eventRowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  eventRowDate: {
    fontSize: 11,
    color: "#8A7A5A",
    textTransform: "capitalize",
  },
  eventStatusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  eventStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0A0A0A",
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  userEmail: {
    fontSize: 11,
    color: "#8A7A5A",
  },
  userRole: {
    fontSize: 11,
    color: "#8A7A5A",
    fontWeight: "600",
  },
});
