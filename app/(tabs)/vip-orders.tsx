import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";

const VIP_ITEMS = [
  {
    id: "champagne",
    name: "Botella de Champagne",
    description: "Moët & Chandon o similar, servicio en mesa",
    emoji: "🍾",
    category: "Bebidas Premium",
  },
  {
    id: "cheese_board",
    name: "Tabla de Quesos y Embutidos",
    description: "Selección gourmet con frutos secos y mermeladas artesanales",
    emoji: "🧀",
    category: "Gastronomía",
  },
  {
    id: "cocktail",
    name: "Cóctel Especial de la Casa",
    description: "Preparación exclusiva del bartender del evento",
    emoji: "🍸",
    category: "Bebidas Premium",
  },
  {
    id: "private_table",
    name: "Servicio de Mesa Privada",
    description: "Mesa reservada con atención personalizada durante el evento",
    emoji: "🛋️",
    category: "Experiencia VIP",
  },
  {
    id: "photo",
    name: "Fotografía Profesional",
    description: "Sesión fotográfica profesional durante el evento (5 fotos editadas)",
    emoji: "📸",
    category: "Experiencia VIP",
  },
];

export default function VipOrdersScreen() {
  const { user } = useAuth();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [activeEventId, setActiveEventId] = useState<number | null>(null);
  const [activeInvitationId, setActiveInvitationId] = useState<number | null>(null);

  const { data: invitations, isLoading: loadingInvitations } = trpc.invitations.myInvitations.useQuery(
    undefined,
    { enabled: !!user }
  );
  const { data: events } = trpc.events.list.useQuery();
  const { data: myOrders, refetch: refetchOrders } = trpc.vipOrders.myOrders.useQuery(
    undefined,
    { enabled: !!user, refetchInterval: 10000 } // Poll every 10s for real-time order status
  );

  const createOrder = trpc.vipOrders.create.useMutation({
    onSuccess: () => {
      refetchOrders();
      setSelectedItems(new Set());
      Alert.alert(
        "¡Pedido VIP enviado! 👑",
        "Tu pedido ha sido recibido. El equipo de servicio VIP lo atenderá en breve.",
        [{ text: "Perfecto", style: "default" }]
      );
    },
    onError: (err) => {
      Alert.alert("Error", err.message);
    },
  });

  const paidInvitations = invitations?.filter(
    (i) => i.status === "paid" || i.status === "checked_in"
  ) ?? [];

  const activeInvitation = paidInvitations[0];
  const eventId = activeEventId ?? activeInvitation?.eventId ?? null;
  const invitationId = activeInvitationId ?? activeInvitation?.id ?? null;

  const getEventTitle = (id: number) =>
    events?.find((e) => e.id === id)?.title ?? "Evento VIP";

  const toggleItem = (itemId: string) => {
    const next = new Set(selectedItems);
    if (next.has(itemId)) {
      next.delete(itemId);
    } else {
      next.add(itemId);
    }
    setSelectedItems(next);
  };

  const handleSubmitOrder = () => {
    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión");
      return;
    }
    if (!eventId || !invitationId) {
      Alert.alert(
        "Sin invitación activa",
        "Necesitas tener una entrada pagada para hacer pedidos VIP."
      );
      return;
    }
    if (selectedItems.size === 0) {
      Alert.alert("Selecciona artículos", "Elige al menos un artículo VIP para ordenar.");
      return;
    }
    createOrder.mutate({
      eventId,
      invitationId,
      items: JSON.stringify(Array.from(selectedItems)),
      notes: notes || undefined,
    });
  };

  const ORDER_STATUS_LABELS: Record<string, { label: string; color: string; icon: string; bg: string }> = {
    pending: { label: "En preparación...", color: "#F39C12", icon: "⏳", bg: "#F39C1222" },
    confirmed: { label: "En camino →", color: "#3498DB", icon: "🚀", bg: "#3498DB22" },
    delivered: { label: "Entregado ✓", color: "#27AE60", icon: "✅", bg: "#27AE6022" },
    cancelled: { label: "Cancelado", color: "#C0392B", icon: "❌", bg: "#C0392B22" },
  };

  if (!user) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>👑</Text>
          <Text style={styles.emptyTitle}>Servicio VIP</Text>
          <Text style={styles.emptySubtitle}>Inicia sesión para acceder al servicio VIP exclusivo</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Servicio VIP</Text>
          <Text style={styles.headerSubtitle}>Artículos exclusivos durante el evento</Text>
        </View>

        {/* Active Event */}
        {activeInvitation && (
          <View style={styles.activeEventCard}>
            <Text style={styles.activeEventLabel}>EVENTO ACTIVO</Text>
            <Text style={styles.activeEventTitle}>
              {getEventTitle(activeInvitation.eventId)}
            </Text>
          </View>
        )}

        {paidInvitations.length === 0 && (
          <View style={styles.noAccessCard}>
            <Text style={styles.noAccessIcon}>🔒</Text>
            <Text style={styles.noAccessText}>
              Necesitas una entrada pagada para acceder al servicio VIP
            </Text>
          </View>
        )}

        {/* VIP Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menú VIP — Selecciona tus artículos</Text>
          <View style={styles.menuGrid}>
            {VIP_ITEMS.map((item) => {
              const isSelected = selectedItems.has(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, isSelected && styles.menuItemSelected]}
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.8}
                  disabled={paidInvitations.length === 0}
                >
                  <View style={styles.menuItemTop}>
                    <Text style={styles.menuItemEmoji}>{item.emoji}</Text>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Text style={styles.checkText}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.menuItemCategory}>{item.category}</Text>
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  <Text style={styles.menuItemDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Order Summary */}
        {selectedItems.size > 0 && (
          <View style={styles.orderSummary}>
            <Text style={styles.orderSummaryTitle}>
              {selectedItems.size} artículo(s) seleccionado(s)
            </Text>
            <View style={styles.selectedList}>
              {Array.from(selectedItems).map((id) => {
                const item = VIP_ITEMS.find((i) => i.id === id);
                return item ? (
                  <View key={id} style={styles.selectedItem}>
                    <Text style={styles.selectedItemEmoji}>{item.emoji}</Text>
                    <Text style={styles.selectedItemName}>{item.name}</Text>
                  </View>
                ) : null;
              })}
            </View>
            <TouchableOpacity
              style={[
                styles.orderBtn,
                createOrder.isPending && styles.orderBtnDisabled,
              ]}
              onPress={handleSubmitOrder}
              disabled={createOrder.isPending}
            >
              {createOrder.isPending ? (
                <ActivityIndicator color="#0A0A0A" />
              ) : (
                <Text style={styles.orderBtnText}>Enviar Pedido VIP 👑</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* My Orders History */}
        {myOrders && myOrders.length > 0 && (
          <View style={[styles.section, { marginBottom: 24 }]}>
            <Text style={styles.sectionTitle}>Mis Pedidos</Text>
            {myOrders.map((order) => {
              const items = (() => {
                try {
                  return JSON.parse(order.items) as string[];
                } catch {
                  return [];
                }
              })();
              const statusInfo = ORDER_STATUS_LABELS[order.status] ?? {
                label: order.status,
                color: "#8A7A5A",
              };
              return (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderCardHeader}>
                    <Text style={styles.orderCardDate}>
                      {new Date(order.createdAt).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg, borderColor: statusInfo.color + "55" }]}>
                      <Text style={styles.statusBadgeIcon}>{statusInfo.icon}</Text>
                      <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                    </View>
                  </View>
                  <View style={styles.orderCardItems}>
                    {items.map((itemId) => {
                      const vipItem = VIP_ITEMS.find((i) => i.id === itemId);
                      return vipItem ? (
                        <Text key={itemId} style={styles.orderCardItem}>
                          {vipItem.emoji} {vipItem.name}
                        </Text>
                      ) : null;
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  activeEventCard: {
    marginHorizontal: 20,
    backgroundColor: "#C9A84C11",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#C9A84C33",
    marginBottom: 4,
  },
  activeEventLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#C9A84C",
    letterSpacing: 1,
    marginBottom: 4,
  },
  activeEventTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  noAccessCard: {
    marginHorizontal: 20,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  noAccessIcon: {
    fontSize: 24,
  },
  noAccessText: {
    flex: 1,
    color: "#8A7A5A",
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F5E6C8",
    marginBottom: 14,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  menuItem: {
    width: "47%",
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 6,
  },
  menuItemSelected: {
    borderColor: "#C9A84C",
    backgroundColor: "#C9A84C11",
  },
  menuItemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  menuItemEmoji: {
    fontSize: 32,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    color: "#0A0A0A",
    fontSize: 12,
    fontWeight: "800",
  },
  menuItemCategory: {
    fontSize: 9,
    fontWeight: "700",
    color: "#C9A84C",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  menuItemName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F5E6C8",
    lineHeight: 18,
  },
  menuItemDesc: {
    fontSize: 11,
    color: "#8A7A5A",
    lineHeight: 15,
  },
  orderSummary: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#C9A84C33",
    gap: 12,
  },
  orderSummaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#C9A84C",
  },
  selectedList: {
    gap: 8,
  },
  selectedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectedItemEmoji: {
    fontSize: 18,
  },
  selectedItemName: {
    fontSize: 13,
    color: "#F5E6C8",
    fontWeight: "600",
  },
  orderBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  orderBtnDisabled: {
    opacity: 0.6,
  },
  orderBtnText: {
    color: "#0A0A0A",
    fontSize: 15,
    fontWeight: "700",
  },
  orderCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    marginBottom: 10,
    gap: 10,
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderCardDate: {
    fontSize: 12,
    color: "#8A7A5A",
    textTransform: "capitalize",
  },
  orderCardStatus: {
    fontSize: 12,
    fontWeight: "700",
  },
  orderCardItems: {
    gap: 6,
  },
  orderCardItem: {
    fontSize: 13,
    color: "#F5E6C8",
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  statusBadgeIcon: { fontSize: 13 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },
});
