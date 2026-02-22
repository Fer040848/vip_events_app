import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { ScreenContainer } from "@/components/screen-container";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "⏳ Pendiente de pago", color: "#F39C12", bg: "#F39C1222" },
  paid: { label: "✅ Pagado — Activo", color: "#27AE60", bg: "#27AE6022" },
  checked_in: { label: "🎉 Ingresado", color: "#8A7A5A", bg: "#8A7A5A22" },
  cancelled: { label: "❌ Cancelado", color: "#C0392B", bg: "#C0392B22" },
};

export default function MyQRScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedInvitation, setSelectedInvitation] = useState<number | null>(null);
  const [generatingFor, setGeneratingFor] = useState<number | null>(null);

  const { data: invitations, isLoading, refetch } = trpc.invitations.myInvitations.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: events, isLoading: eventsLoading } = trpc.events.list.useQuery();

  const createInvitation = trpc.invitations.create.useMutation({
    onSuccess: () => {
      refetch();
      setGeneratingFor(null);
      Alert.alert(
        "🎫 ¡QR Generado!",
        "Tu código QR personalizado está listo. Ahora puedes proceder al pago para activar tu entrada.",
        [{ text: "Ver mi QR", style: "default" }]
      );
    },
    onError: (err) => {
      setGeneratingFor(null);
      Alert.alert("Error", err.message);
    },
  });

  const getEventTitle = (eventId: number) => {
    return events?.find((e) => e.id === eventId)?.title ?? "Evento VIP";
  };

  const getEvent = (eventId: number) => events?.find((e) => e.id === eventId);

  const handleGenerateQR = (eventId: number) => {
    setGeneratingFor(eventId);
    const qrCode = `VIP-${user?.id ?? "0"}-${eventId}-${Date.now().toString(36).toUpperCase()}`;
    createInvitation.mutate({ eventId, qrCode });
  };

  const handlePay = (eventId: number) => {
    const event = getEvent(eventId);
    if (event?.mercadoPagoLink) {
      Linking.openURL(event.mercadoPagoLink);
    } else {
      Alert.alert("Pago", "El enlace de pago estará disponible pronto. Contacta al organizador.");
    }
  };

  const handleShareWhatsApp = async (invitation: NonNullable<typeof invitations>[0]) => {
    const eventTitle = getEventTitle(invitation.eventId);
    const statusLabel = STATUS_LABELS[invitation.status]?.label ?? invitation.status;
    const message = `🎉 *Mi Invitación VIP*\n\n👑 Evento: ${eventTitle}\n🎫 Estado: ${statusLabel}\n\n🔑 Código QR: \`${invitation.qrCode}\`\n\nDescargá la app VIP Events para ver tu QR completo.`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      Linking.openURL(whatsappUrl);
    } else {
      // Fallback to native share
      try {
        await Share.share({
          message,
          title: "Mi Invitación VIP",
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleShareNative = async (invitation: NonNullable<typeof invitations>[0]) => {
    const eventTitle = getEventTitle(invitation.eventId);
    try {
      await Share.share({
        message: `🎉 Mi Invitación VIP para ${eventTitle}\n\nCódigo QR: ${invitation.qrCode}\n\nEstado: ${STATUS_LABELS[invitation.status]?.label ?? invitation.status}`,
        title: "Mi Invitación VIP",
      });
    } catch (e) {
      console.error(e);
    }
  };

  const activeInvitations = invitations?.filter(
    (i) => i.status === "paid" || i.status === "pending" || i.status === "checked_in"
  ) ?? [];

  const displayedInvitation =
    selectedInvitation !== null
      ? invitations?.find((i) => i.id === selectedInvitation)
      : activeInvitations[0];

  const eventsWithoutInvitation = events?.filter(
    (e) => e.status === "published" && !invitations?.find((i) => i.eventId === e.id)
  ) ?? [];

  if (isLoading || eventsLoading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#C9A84C" />
          <Text style={styles.loadingText}>Cargando tus invitaciones...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!user) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🔒</Text>
          <Text style={styles.emptyTitle}>Inicia sesión</Text>
          <Text style={styles.emptySubtitle}>Necesitas iniciar sesión para ver tu QR</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/login" as any)}>
            <Text style={styles.primaryBtnText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <FlatList
        data={[]}
        keyExtractor={() => ""}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Mi Acceso VIP</Text>
              <Text style={styles.headerSubtitle}>Tu llave de entrada al evento</Text>
            </View>

            {/* QR Display */}
            {displayedInvitation ? (
              <View style={styles.qrCard}>
                <View style={styles.qrHeader}>
                  <Text style={styles.qrEventTitle} numberOfLines={2}>
                    {getEventTitle(displayedInvitation.eventId)}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: STATUS_LABELS[displayedInvitation.status]?.bg ?? "#1A1A1A" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: STATUS_LABELS[displayedInvitation.status]?.color ?? "#8A7A5A" },
                      ]}
                    >
                      {STATUS_LABELS[displayedInvitation.status]?.label ?? displayedInvitation.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.qrContainer}>
                  <View style={styles.qrWrapper}>
                    <QRCode
                      value={displayedInvitation.qrCode}
                      size={200}
                      color="#0A0A0A"
                      backgroundColor="#F5E6C8"
                    />
                  </View>
                  {displayedInvitation.status === "checked_in" && (
                    <View style={styles.usedOverlay}>
                      <Text style={styles.usedText}>✓ INGRESADO</Text>
                    </View>
                  )}
                </View>

                <View style={styles.qrInfo}>
                  <Text style={styles.qrName}>{user.name ?? "Invitado VIP"}</Text>
                  <Text style={styles.qrCode}>{displayedInvitation.qrCode}</Text>
                </View>

                {/* Action buttons */}
                <View style={styles.actionRow}>
                  {displayedInvitation.status === "pending" && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.payBtn]}
                      onPress={() => handlePay(displayedInvitation.eventId)}
                    >
                      <Text style={styles.payBtnText}>💳 Pagar Entrada</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.whatsappBtn]}
                    onPress={() => handleShareWhatsApp(displayedInvitation)}
                  >
                    <Text style={styles.whatsappBtnText}>📱 WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.shareBtn]}
                    onPress={() => handleShareNative(displayedInvitation)}
                  >
                    <Text style={styles.shareBtnText}>⬆️ Compartir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎫</Text>
                <Text style={styles.emptyTitle}>Sin invitaciones activas</Text>
                <Text style={styles.emptySubtitle}>
                  Genera tu QR para un evento publicado o ve al calendario de eventos
                </Text>
              </View>
            )}

            {/* All Invitations Selector */}
            {invitations && invitations.length > 1 && (
              <View style={styles.allInvitations}>
                <Text style={styles.sectionTitle}>Mis invitaciones</Text>
                <FlatList
                  data={invitations}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingHorizontal: 0 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.invitationChip,
                        (selectedInvitation === item.id || (displayedInvitation?.id === item.id && selectedInvitation === null)) && styles.invitationChipSelected,
                      ]}
                      onPress={() => setSelectedInvitation(selectedInvitation === item.id ? null : item.id)}
                    >
                      <Text style={styles.invitationChipText} numberOfLines={1}>
                        {getEventTitle(item.eventId)}
                      </Text>
                      <View style={[styles.chipDot, { backgroundColor: STATUS_LABELS[item.status]?.color ?? "#8A7A5A" }]} />
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {/* Generate QR for available events */}
            {eventsWithoutInvitation.length > 0 && (
              <View style={styles.generateSection}>
                <Text style={styles.sectionTitle}>🎟️ Obtener Entrada</Text>
                <Text style={styles.sectionSubtitle}>Genera tu QR personalizado para estos eventos</Text>
                {eventsWithoutInvitation.map((event) => (
                  <View key={event.id} style={styles.generateCard}>
                    <View style={styles.generateCardInfo}>
                      <Text style={styles.generateCardTitle} numberOfLines={2}>{event.title}</Text>
                      <Text style={styles.generateCardDate}>
                        📅 {new Date(event.date).toLocaleDateString("es-MX", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      <Text style={styles.generateCardPrice}>💰 ${event.price} MXN · Barra libre</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.generateBtn, generatingFor === event.id && styles.generateBtnLoading]}
                      onPress={() => handleGenerateQR(event.id)}
                      disabled={generatingFor === event.id}
                    >
                      {generatingFor === event.id ? (
                        <ActivityIndicator color="#0A0A0A" size="small" />
                      ) : (
                        <Text style={styles.generateBtnText}>Generar QR</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* No events available */}
            {eventsWithoutInvitation.length === 0 && activeInvitations.length === 0 && (
              <View style={styles.noEventsCard}>
                <Text style={styles.noEventsText}>No hay eventos disponibles en este momento.</Text>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => router.push("/(tabs)/events" as any)}
                >
                  <Text style={styles.primaryBtnText}>Ver Calendario</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        renderItem={() => null}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  loadingText: {
    color: "#8A7A5A",
    fontSize: 13,
    marginTop: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
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
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 32,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F5E6C8",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#8A7A5A",
    textAlign: "center",
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  primaryBtnText: {
    color: "#0A0A0A",
    fontSize: 15,
    fontWeight: "700",
  },
  qrCard: {
    marginHorizontal: 20,
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#C9A84C33",
    gap: 16,
  },
  qrHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  qrEventTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#F5E6C8",
    lineHeight: 22,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  qrContainer: {
    alignItems: "center",
    position: "relative",
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: "#F5E6C8",
    borderRadius: 16,
  },
  usedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  usedText: {
    color: "#27AE60",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2,
  },
  qrInfo: {
    alignItems: "center",
    gap: 4,
  },
  qrName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  qrCode: {
    fontSize: 11,
    color: "#8A7A5A",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
  },
  payBtn: {
    backgroundColor: "#C9A84C",
    flex: 2,
  },
  payBtnText: {
    color: "#0A0A0A",
    fontSize: 13,
    fontWeight: "700",
  },
  whatsappBtn: {
    backgroundColor: "#25D36622",
    borderWidth: 1,
    borderColor: "#25D36644",
  },
  whatsappBtnText: {
    color: "#25D366",
    fontSize: 12,
    fontWeight: "700",
  },
  shareBtn: {
    backgroundColor: "#C9A84C22",
    borderWidth: 1,
    borderColor: "#C9A84C44",
  },
  shareBtnText: {
    color: "#C9A84C",
    fontSize: 12,
    fontWeight: "700",
  },
  allInvitations: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#C9A84C",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#8A7A5A",
    marginBottom: 12,
  },
  invitationChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 8,
    maxWidth: 180,
  },
  invitationChipSelected: {
    borderColor: "#C9A84C",
    backgroundColor: "#C9A84C11",
  },
  invitationChipText: {
    color: "#F5E6C8",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  generateSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  generateCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  generateCardInfo: {
    flex: 1,
    gap: 4,
  },
  generateCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F5E6C8",
    lineHeight: 20,
  },
  generateCardDate: {
    fontSize: 11,
    color: "#C9A84C",
  },
  generateCardPrice: {
    fontSize: 11,
    color: "#8A7A5A",
  },
  generateBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    minWidth: 90,
  },
  generateBtnLoading: {
    opacity: 0.7,
  },
  generateBtnText: {
    color: "#0A0A0A",
    fontSize: 12,
    fontWeight: "700",
  },
  noEventsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  noEventsText: {
    color: "#8A7A5A",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});
