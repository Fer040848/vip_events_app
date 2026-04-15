import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

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
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  const eventDate = nextEvent?.date ? new Date(nextEvent.date) : null;
  const countdown = useCountdown(eventDate);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
          />
        }
      >
        {/* Header con gradiente */}
        <LinearGradient
          colors={["#6366F1", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Bienvenido de vuelta</Text>
              <Text style={styles.userName}>{user?.name ?? "Invitado VIP"}</Text>
            </View>
            <TouchableOpacity
              style={styles.notifButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/profile" as any);
              }}
            >
              <Text style={styles.notifIcon}>🔔</Text>
              {recentNotifications.length > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{recentNotifications.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Featured Event Banner */}
        {isLoading ? (
          <View style={styles.loadingBanner}>
            <ActivityIndicator color="#6366F1" size="large" />
          </View>
        ) : nextEvent ? (
          <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
              style={styles.featuredBanner}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push(`/event/${nextEvent.id}` as any);
              }}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#6366F1", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bannerGradient}
              >
                {nextEvent.imageUrl && (
                  <Image
                    source={{ uri: nextEvent.imageUrl }}
                    style={styles.bannerImage}
                    contentFit="cover"
                  />
                )}
                <View style={styles.bannerOverlay}>
                  <View style={styles.bannerBadge}>
                    <Text style={styles.bannerBadgeText}>✨ PRÓXIMO EVENTO</Text>
                  </View>
                  <Text style={styles.bannerTitle}>{nextEvent.title}</Text>
                  <Text style={styles.bannerDate}>
                    {new Date(nextEvent.date).toLocaleDateString("es-MX", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </Text>

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
                      <Text style={styles.liveText}>EN VIVO AHORA 🔴</Text>
                    </View>
                  )}

                  <View style={styles.bannerFooter}>
                    <View>
                      <Text style={styles.bannerPrice}>${nextEvent.price} MXN</Text>
                      <Text style={styles.bannerLocation}>📍 {nextEvent.location ?? "Lugar por confirmar"}</Text>
                    </View>
                    <View style={styles.bannerCTA}>
                      <Text style={styles.bannerCTAText}>Ver detalles →</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.noEventBanner}>
            <Text style={styles.noEventIcon}>👑</Text>
            <Text style={styles.noEventText}>No hay eventos próximos</Text>
            <Text style={styles.noEventSubtext}>¡Mantente atento para nuevas sorpresas!</Text>
          </View>
        )}

        {/* Quick Access Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceso Rápido</Text>
          <View style={styles.quickGrid}>
            <QuickCard
              icon="🎫"
              label="Mi QR"
              sublabel={`${paidInvitations.length} activo(s)`}
              onPress={() => router.push("/(tabs)/my-qr" as any)}
              gradient={["#6366F1", "#818CF8"]}
            />
            <QuickCard
              icon="📅"
              label="Eventos"
              sublabel="Ver calendario"
              onPress={() => router.push("/(tabs)/events" as any)}
              gradient={["#EC4899", "#F472B6"]}
            />
            <QuickCard
              icon="🍾"
              label="Servicio VIP"
              sublabel="Pedir ahora"
              onPress={() => router.push("/(tabs)/vip-orders" as any)}
              gradient={["#10B981", "#34D399"]}
            />
            <QuickCard
              icon="💬"
              label="Chat"
              sublabel="Conectar"
              onPress={() => router.push("/(tabs)/chat" as any)}
              gradient={["#F59E0B", "#FBBF24"]}
            />
          </View>
        </View>

        {/* Upcoming Events */}
        {events && events.length > 1 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Próximos Eventos</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/events" as any)}>
                <Text style={styles.seeAll}>Ver todos →</Text>
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
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/event/${item.id}` as any);
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#6366F1", "#EC4899"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.eventCardGradient}
                  >
                    {item.imageUrl && (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.eventCardImage}
                        contentFit="cover"
                      />
                    )}
                    <View style={styles.eventCardContent}>
                      <Text style={styles.eventCardTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.eventCardDate}>
                        {new Date(item.date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                      </Text>
                      <Text style={styles.eventCardPrice}>${item.price} MXN</Text>
                    </View>
                  </LinearGradient>
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
  gradient,
}: {
  icon: string;
  label: string;
  sublabel: string;
  onPress: () => void;
  gradient: [string, string];
}) {
  return (
    <TouchableOpacity
      style={styles.quickCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quickCardGradient}
      >
        <Text style={styles.quickCardIcon}>{icon}</Text>
        <Text style={styles.quickCardLabel}>{label}</Text>
        <Text style={styles.quickCardSublabel}>{sublabel}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  headerGradient: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 4,
  },
  notifButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  notifIcon: {
    fontSize: 24,
  },
  notifBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  notifBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  loadingBanner: {
    height: 200,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  featuredBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: "hidden",
    height: 280,
  },
  bannerGradient: {
    flex: 1,
    justifyContent: "space-between",
  },
  bannerImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  bannerBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    backdropFilter: "blur(10px)",
  },
  bannerBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 8,
  },
  bannerDate: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  countdownRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  countdownBlock: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  countdownNum: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  countdownLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  eventLiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  liveText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  bannerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  bannerPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  bannerLocation: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  bannerCTA: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bannerCTAText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  noEventBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 40,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
    borderStyle: "dashed",
  },
  noEventIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noEventText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F8FAFC",
  },
  noEventSubtext: {
    fontSize: 12,
    color: "rgba(248, 250, 252, 0.6)",
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F8FAFC",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 12,
    color: "#6366F1",
    fontWeight: "600",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  quickCard: {
    width: "48%",
    borderRadius: 16,
    overflow: "hidden",
  },
  quickCardGradient: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickCardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickCardLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  quickCardSublabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
  },
  eventCard: {
    width: width - 80,
    borderRadius: 16,
    overflow: "hidden",
    height: 200,
  },
  eventCardGradient: {
    flex: 1,
    justifyContent: "flex-end",
  },
  eventCardImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  eventCardContent: {
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  eventCardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  eventCardDate: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
  },
  eventCardPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#F5D78E",
    marginTop: 4,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#6366F1",
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6366F1",
    marginTop: 6,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#F8FAFC",
  },
  notifBody: {
    fontSize: 12,
    color: "rgba(248, 250, 252, 0.7)",
    marginTop: 4,
  },
});
