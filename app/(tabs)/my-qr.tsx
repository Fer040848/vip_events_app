import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { ScreenContainer } from "@/components/screen-container";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pendiente de pago", color: "#F39C12", bg: "#F39C1222" },
  paid: { label: "Pagado — Activo", color: "#27AE60", bg: "#27AE6022" },
  checked_in: { label: "Ingresado", color: "#8A7A5A", bg: "#8A7A5A22" },
  cancelled: { label: "Cancelado", color: "#C0392B", bg: "#C0392B22" },
};

export default function MyQRScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedInvitation, setSelectedInvitation] = useState<number | null>(null);

  const { data: invitations, isLoading } = trpc.invitations.myInvitations.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: events } = trpc.events.list.useQuery();

  const getEventTitle = (eventId: number) => {
    return events?.find((e) => e.id === eventId)?.title ?? "Evento VIP";
  };

  const activeInvitations = invitations?.filter(
    (i) => i.status === "paid" || i.status === "pending"
  ) ?? [];

  const displayedInvitation =
    selectedInvitation !== null
      ? invitations?.find((i) => i.id === selectedInvitation)
      : activeInvitations[0];

  const handleShare = async () => {
    if (!displayedInvitation) return;
    try {
      await Share.share({
        message: `Mi código VIP para ${getEventTitle(displayedInvitation.eventId)}: ${displayedInvitation.qrCode}`,
        title: "Mi Invitación VIP",
      });
    } catch (e) {
      console.error(e);
    }
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

  if (!user) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🔒</Text>
          <Text style={styles.emptyTitle}>Inicia sesión</Text>
          <Text style={styles.emptySubtitle}>Necesitas iniciar sesión para ver tu QR</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push("/login" as any)}>
            <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Acceso VIP</Text>
          <Text style={styles.headerSubtitle}>Tu llave de entrada al evento</Text>
        </View>

        {activeInvitations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎫</Text>
            <Text style={styles.emptyTitle}>Sin invitaciones activas</Text>
            <Text style={styles.emptySubtitle}>
              Compra tu entrada en la sección de Eventos para obtener tu QR personalizado
            </Text>
            <TouchableOpacity
              style={styles.goToEventsBtn}
              onPress={() => router.push("/(tabs)/events" as any)}
            >
              <Text style={styles.goToEventsBtnText}>Ver Eventos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* QR Display */}
            {displayedInvitation && (
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

                <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                  <Text style={styles.shareBtnText}>Compartir QR</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* All Invitations */}
            {invitations && invitations.length > 1 && (
              <View style={styles.allInvitations}>
                <Text style={styles.allInvitationsTitle}>Todas mis invitaciones</Text>
                <FlatList
                  data={invitations}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.invitationChip,
                        selectedInvitation === item.id && styles.invitationChipSelected,
                        displayedInvitation?.id === item.id &&
                          selectedInvitation === null &&
                          styles.invitationChipSelected,
                      ]}
                      onPress={() =>
                        setSelectedInvitation(
                          selectedInvitation === item.id ? null : item.id
                        )
                      }
                    >
                      <Text style={styles.invitationChipText} numberOfLines={1}>
                        {getEventTitle(item.eventId)}
                      </Text>
                      <View
                        style={[
                          styles.chipDot,
                          { backgroundColor: STATUS_LABELS[item.status]?.color ?? "#8A7A5A" },
                        ]}
                      />
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </>
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
    paddingHorizontal: 32,
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
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
  goToEventsBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  goToEventsBtnText: {
    color: "#0A0A0A",
    fontSize: 15,
    fontWeight: "700",
  },
  loginBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  loginBtnText: {
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
  shareBtn: {
    backgroundColor: "#C9A84C22",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C9A84C44",
  },
  shareBtnText: {
    color: "#C9A84C",
    fontSize: 14,
    fontWeight: "700",
  },
  allInvitations: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  allInvitationsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8A7A5A",
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
});
