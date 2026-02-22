import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!targetDate) return;
    const calc = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };
    calc();
    timerRef.current = setInterval(calc, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [targetDate]);

  return timeLeft;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: events, isLoading, refetch } = trpc.events.upcoming.useQuery();
  const { data: notifications } = trpc.notifications.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: myInvitations } = trpc.invitations.myInvitations.useQuery(undefined, {
    enabled: !!user,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const nextEvent = events?.[0];
  const recentNotifications = notifications?.slice(0, 3) ?? [];
  const paidInvitations = myInvitations?.filter((i) => i.status === "paid" || i.status === "checked_in") ?? [];

  // Countdown to next event
  const eventDate = nextEvent?.date ? new Date(nextEvent.date) : null;
  const countdown = useCountdown(eventDate);

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C9A84C"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bienvenido</Text>
            <Text style={styles.userName}>{user?.name ?? "Invitado VIP"}</Text>
          </View>
          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => router.push("/(tabs)/profile" as any)}
          >
            <Text style={styles.notifIcon}>🔔</Text>
            {recentNotifications.length > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{recentNotifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Featured Event Banner */}
        {isLoading ? (
          <View style={styles.loadingBanner}>
            <ActivityIndicator color="#C9A84C" />
          </View>
        ) : nextEvent ? (
          <TouchableOpacity
            style={styles.featuredBanner}
            onPress={() => router.push(`/event/${nextEvent.id}` as any)}
            activeOpacity={0.9}
          >
            {nextEvent.imageUrl ? (
              <Image source={{ uri: nextEvent.imageUrl }} style={styles.bannerImage} />
            ) : (
              <View style={styles.bannerPlaceholder} />
            )}
            <View style={styles.bannerOverlay}>
              <View style={styles.bannerBadge}>
                <Text style={styles.bannerBadgeText}>PRÓXIMO EVENTO</Text>
              </View>
              <Text style={styles.bannerTitle}>{nextEvent.title}</Text>
              <Text style={styles.bannerDate}>
                {new Date(nextEvent.date).toLocaleDateString("es-MX", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </Text>
              {/* Countdown */}
              {!countdown.expired && (
                <View style={styles.countdownRow}>
                  {[
                    { val: countdown.days, label: "DÍAS" },
                    { val: countdown.hours, label: "HRS" },
                    { val: countdown.minutes, label: "MIN" },
                    { val: countdown.seconds, label: "SEG" },
                  ].map(({ val, label }) => (
                    <View key={label} style={styles.countdownBlock}>
                      <Text style={styles.countdownNum}>{String(val).padStart(2, "0")}</Text>
                      <Text style={styles.countdownLabel}>{label}</Text>
                    </View>
                  ))}
                </View>
              )}
              {countdown.expired && (
                <View style={styles.eventLiveRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>EN VIVO AHORA</Text>
                </View>
              )}
              <View style={styles.bannerFooter}>
                <Text style={styles.bannerPrice}>${nextEvent.price} MXN</Text>
                <Text style={styles.bannerLocation}>{nextEvent.location ?? "Lugar por confirmar"}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.noEventBanner}>
            <Text style={styles.noEventIcon}>👑</Text>
            <Text style={styles.noEventText}>No hay eventos próximos</Text>
          </View>
        )}

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceso Rápido</Text>
          <View style={styles.quickGrid}>
            <QuickCard
              icon="🎫"
              label="Mi QR"
              sublabel={`${paidInvitations.length} activo(s)`}
              onPress={() => router.push("/(tabs)/my-qr" as any)}
            />
            <QuickCard
              icon="📅"
              label="Eventos"
              sublabel="Ver calendario"
              onPress={() => router.push("/(tabs)/events" as any)}
            />
            <QuickCard
              icon="🍾"
              label="Servicio VIP"
              sublabel="Pedir ahora"
              onPress={() => router.push("/(tabs)/vip-orders" as any)}
            />
            <QuickCard
              icon="🔔"
              label="Notificaciones"
              sublabel={`${recentNotifications.length} nuevas`}
              onPress={() => router.push("/(tabs)/profile" as any)}
            />
          </View>
        </View>

        {/* Upcoming Events */}
        {events && events.length > 1 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Próximos Eventos</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/events" as any)}>
                <Text style={styles.seeAll}>Ver todos</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={events.slice(1, 4)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 2 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.eventCard}
                  onPress={() => router.push(`/event/${item.id}` as any)}
                  activeOpacity={0.85}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.eventCardImage} />
                  ) : (
                    <View style={styles.eventCardImagePlaceholder}>
                      <Text style={{ fontSize: 32 }}>🎉</Text>
                    </View>
                  )}
                  <View style={styles.eventCardContent}>
                    <Text style={styles.eventCardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.eventCardDate}>
                      {new Date(item.date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                    </Text>
                    <Text style={styles.eventCardPrice}>${item.price} MXN</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Recent Notifications */}
        {recentNotifications.length > 0 && (
          <View style={[styles.section, { marginBottom: 24 }]}>
            <Text style={styles.sectionTitle}>Notificaciones Recientes</Text>
            {recentNotifications.map((notif) => (
              <View key={notif.id} style={styles.notifCard}>
                <View style={styles.notifDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function QuickCard({
  icon,
  label,
  sublabel,
  onPress,
}: {
  icon: string;
  label: string;
  sublabel: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.quickCardIcon}>{icon}</Text>
      <Text style={styles.quickCardLabel}>{label}</Text>
      <Text style={styles.quickCardSublabel}>{sublabel}</Text>
    </TouchableOpacity>
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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 13,
    color: "#8A7A5A",
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F5E6C8",
    marginTop: 2,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  notifIcon: {
    fontSize: 20,
  },
  notifBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#C9A84C",
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadgeText: {
    color: "#0A0A0A",
    fontSize: 10,
    fontWeight: "700",
  },
  loadingBanner: {
    height: 220,
    marginHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  featuredBanner: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
    height: 220,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#C9A84C33",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  bannerPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1A1A1A",
    position: "absolute",
  },
  bannerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 20,
    justifyContent: "flex-end",
  },
  bannerBadge: {
    backgroundColor: "#C9A84C",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  bannerBadgeText: {
    color: "#0A0A0A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F5E6C8",
    marginBottom: 4,
  },
  bannerDate: {
    fontSize: 13,
    color: "#C9A84C",
    marginBottom: 12,
    textTransform: "capitalize",
  },
  bannerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#C9A84C",
  },
  bannerLocation: {
    fontSize: 12,
    color: "#8A7A5A",
    flex: 1,
    textAlign: "right",
    marginLeft: 8,
  },
  noEventBanner: {
    marginHorizontal: 20,
    borderRadius: 20,
    height: 160,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  noEventIcon: {
    fontSize: 40,
  },
  noEventText: {
    color: "#8A7A5A",
    fontSize: 14,
  },
  section: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F5E6C8",
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  seeAll: {
    fontSize: 13,
    color: "#C9A84C",
    fontWeight: "600",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickCard: {
    flex: 1,
    minWidth: "44%",
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    alignItems: "flex-start",
    gap: 6,
  },
  quickCardIcon: {
    fontSize: 28,
  },
  quickCardLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  quickCardSublabel: {
    fontSize: 11,
    color: "#8A7A5A",
  },
  eventCard: {
    width: 160,
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  eventCardImage: {
    width: "100%",
    height: 100,
  },
  eventCardImagePlaceholder: {
    width: "100%",
    height: 100,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  eventCardContent: {
    padding: 12,
    gap: 4,
  },
  eventCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  eventCardDate: {
    fontSize: 11,
    color: "#C9A84C",
    textTransform: "capitalize",
  },
  eventCardPrice: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8A7A5A",
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 12,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#C9A84C",
    marginTop: 6,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F5E6C8",
    marginBottom: 4,
  },
  notifBody: {
    fontSize: 12,
    color: "#8A7A5A",
    lineHeight: 17,
  },
  countdownRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 10,
  },
  countdownBlock: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 48,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.4)",
  },
  countdownNum: {
    fontSize: 22,
    fontWeight: "800",
    color: "#C9A84C",
    fontVariant: ["tabular-nums"],
  },
  countdownLabel: {
    fontSize: 9,
    color: "#aaa",
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 1,
  },
  eventLiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginVertical: 8,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
  },
  liveText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#22C55E",
    letterSpacing: 2,
  },
});
