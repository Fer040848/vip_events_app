import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const { data: event, isLoading } = trpc.events.get.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );
  const { data: myInvitations } = trpc.invitations.myInvitations.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createInvitation = trpc.invitations.create.useMutation({
    onSuccess: (data) => {
      Alert.alert(
        "¡Invitación creada! 🎫",
        "Tu QR personalizado está listo. Ahora procede al pago para activar tu entrada.",
        [
          {
            text: "Ir a pagar",
            onPress: () => {
              if (event?.mercadoPagoLink) {
                Linking.openURL(event.mercadoPagoLink);
              }
              router.push("/(tabs)/my-qr" as any);
            },
          },
          { text: "Ver mi QR", onPress: () => router.push("/(tabs)/my-qr" as any) },
        ]
      );
    },
    onError: (err) => Alert.alert("Error", err.message),
  });

  const myInvitationForEvent = myInvitations?.find((i) => i.eventId === Number(id));
  const hasPaidInvitation =
    myInvitationForEvent?.status === "paid" ||
    myInvitationForEvent?.status === "checked_in";

  const handleGetTicket = () => {
    if (!isAuthenticated) {
      Alert.alert("Inicia sesión", "Debes iniciar sesión para obtener tu entrada.", [
        { text: "Cancelar", style: "cancel" },
        { text: "Iniciar sesión", onPress: () => router.push("/login" as any) },
      ]);
      return;
    }
    if (myInvitationForEvent) {
      if (hasPaidInvitation) {
        router.push("/(tabs)/my-qr" as any);
        return;
      }
      // Already has invitation, just go to pay
      if (event?.mercadoPagoLink) {
        Linking.openURL(event.mercadoPagoLink);
      } else {
        Alert.alert("Pago", "El enlace de pago estará disponible pronto.");
      }
      return;
    }
    // Create new invitation - generate a unique QR code
    const qrCode = `VIP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    createInvitation.mutate({ eventId: Number(id), qrCode });
  };

  const handleOpenMap = () => {
    if (!event?.location) return;
    const query = encodeURIComponent(event.location);
    const url = `https://maps.google.com/?q=${query}`;
    Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#C9A84C" />
        </View>
      </ScreenContainer>
    );
  }

  if (!event) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.centered}>
          <Text style={styles.errorText}>Evento no encontrado</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Volver</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right"]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹ Volver</Text>
        </TouchableOpacity>

        {/* Event Image */}
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroPlaceholderEmoji}>🎉</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Status Badge */}
          {event.status === "published" && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>● EVENTO ACTIVO</Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Date & Time */}
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <View>
              <Text style={styles.infoLabel}>Fecha y hora</Text>
              <Text style={[styles.infoValue, { textTransform: "capitalize" }]}>
                {formattedDate}
              </Text>
              <Text style={styles.infoValueSecondary}>{formattedTime} hrs</Text>
            </View>
          </View>

          {/* Location */}
          {event.location && (
            <TouchableOpacity style={styles.infoRow} onPress={handleOpenMap} activeOpacity={0.8}>
              <Text style={styles.infoIcon}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Ubicación</Text>
                <Text style={styles.infoValue}>{event.location}</Text>
                {event.locationInstructions && (
                  <Text style={styles.infoValueSecondary}>{event.locationInstructions}</Text>
                )}
                <Text style={styles.mapLink}>Ver en mapa →</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Price */}
          <View style={styles.priceCard}>
            <View>
              <Text style={styles.priceLabel}>Precio de entrada</Text>
              <Text style={styles.priceValue}>${event.price ?? "500"} MXN</Text>
            </View>
            <View style={styles.barraLibreBadge}>
              <Text style={styles.barraLibreText}>🍾 BARRA LIBRE</Text>
            </View>
          </View>

          {/* Description */}
          {event.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Acerca del evento</Text>
              <Text style={styles.descriptionText}>{event.description}</Text>
            </View>
          )}

          {/* VIP Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Incluye en tu entrada VIP</Text>
            <View style={styles.featuresList}>
              {[
                { icon: "🍾", text: "Barra libre durante el evento" },
                { icon: "🎫", text: "QR personalizado de acceso" },
                { icon: "👑", text: "Servicio VIP en mesa" },
                { icon: "📸", text: "Fotografía profesional disponible" },
                { icon: "🔔", text: "Notificaciones en tiempo real" },
              ].map((f, i) => (
                <View key={i} style={styles.featureItem}>
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Guests Info */}
          {event.maxGuests && (
            <View style={styles.guestsInfo}>
              <Text style={styles.guestsIcon}>👥</Text>
              <Text style={styles.guestsText}>
                Evento exclusivo — máximo {event.maxGuests} invitados
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* CTA Button */}
      <View style={styles.ctaContainer}>
        {hasPaidInvitation ? (
          <TouchableOpacity
            style={[styles.ctaBtn, styles.ctaBtnActive]}
            onPress={() => router.push("/(tabs)/my-qr" as any)}
          >
            <Text style={styles.ctaBtnText}>✓ Ver mi QR de entrada</Text>
          </TouchableOpacity>
        ) : myInvitationForEvent ? (
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleGetTicket}
            disabled={createInvitation.isPending}
          >
            <Text style={styles.ctaBtnText}>
              💳 Completar pago — ${event.price ?? "500"} MXN
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.ctaBtn, createInvitation.isPending && styles.ctaBtnDisabled]}
            onPress={handleGetTicket}
            disabled={createInvitation.isPending}
          >
            {createInvitation.isPending ? (
              <ActivityIndicator color="#0A0A0A" />
            ) : (
              <Text style={styles.ctaBtnText}>
                🎫 Obtener entrada — ${event.price ?? "500"} MXN
              </Text>
            )}
          </TouchableOpacity>
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
    gap: 12,
  },
  errorText: {
    color: "#F5E6C8",
    fontSize: 16,
  },
  backLink: {
    color: "#C9A84C",
    fontSize: 14,
  },
  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backBtnText: {
    color: "#F5E6C8",
    fontSize: 14,
    fontWeight: "600",
  },
  heroImage: {
    width: "100%",
    height: 280,
  },
  heroPlaceholder: {
    width: "100%",
    height: 280,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  heroPlaceholderEmoji: {
    fontSize: 80,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  statusBadge: {
    backgroundColor: "#27AE6022",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#27AE6044",
  },
  statusBadgeText: {
    color: "#27AE60",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F5E6C8",
    lineHeight: 34,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  infoIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 11,
    color: "#8A7A5A",
    fontWeight: "600",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: "#F5E6C8",
    fontWeight: "600",
  },
  infoValueSecondary: {
    fontSize: 13,
    color: "#8A7A5A",
    marginTop: 2,
  },
  mapLink: {
    fontSize: 12,
    color: "#C9A84C",
    fontWeight: "600",
    marginTop: 4,
  },
  priceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#C9A84C11",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#C9A84C33",
  },
  priceLabel: {
    fontSize: 11,
    color: "#8A7A5A",
    fontWeight: "600",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#C9A84C",
  },
  barraLibreBadge: {
    backgroundColor: "#C9A84C22",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#C9A84C44",
  },
  barraLibreText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#C9A84C",
    letterSpacing: 0.5,
  },
  descriptionSection: {
    gap: 8,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  descriptionText: {
    fontSize: 14,
    color: "#8A7A5A",
    lineHeight: 22,
  },
  featuresSection: {
    gap: 12,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  featuresList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 14,
    color: "#F5E6C8",
    fontWeight: "500",
  },
  guestsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    marginBottom: 80,
  },
  guestsIcon: {
    fontSize: 20,
  },
  guestsText: {
    fontSize: 13,
    color: "#8A7A5A",
    flex: 1,
    lineHeight: 18,
  },
  ctaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 32,
    backgroundColor: "#0A0A0A",
    borderTopWidth: 1,
    borderTopColor: "#1A1A1A",
  },
  ctaBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaBtnActive: {
    backgroundColor: "#27AE60",
  },
  ctaBtnDisabled: {
    opacity: 0.6,
  },
  ctaBtnText: {
    color: "#0A0A0A",
    fontSize: 16,
    fontWeight: "800",
  },
});
