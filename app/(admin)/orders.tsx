import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: "Pendiente", color: "#F39C12", bg: "#F39C1222", icon: "⏳" },
  confirmed: { label: "Confirmado", color: "#3498DB", bg: "#3498DB22", icon: "✅" },
  delivered: { label: "Entregado", color: "#27AE60", bg: "#27AE6022", icon: "🚀" },
  cancelled: { label: "Cancelado", color: "#C0392B", bg: "#C0392B22", icon: "❌" },
};

const STATUS_ORDER = ["pending", "confirmed", "delivered", "cancelled"] as const;

export default function AdminOrdersScreen() {
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: orders, isLoading, refetch } = trpc.vipOrders.getAllOrders.useQuery(undefined, {
    refetchInterval: 10000, // Poll every 10s
  });

  const updateStatus = trpc.vipOrders.updateStatus.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => Alert.alert("Error", err.message),
  });

  const handleUpdateStatus = (id: number, currentStatus: string, userName: string) => {
    const nextStatuses = STATUS_ORDER.filter((s) => s !== currentStatus && s !== "cancelled");
    const options = nextStatuses.map((s) => ({
      text: `${STATUS_CONFIG[s].icon} ${STATUS_CONFIG[s].label}`,
      onPress: () => updateStatus.mutate({ id, status: s }),
    }));
    options.push({ text: "❌ Cancelar pedido", onPress: () => updateStatus.mutate({ id, status: "cancelled" }) });
    options.push({ text: "Cerrar", onPress: () => {} });

    Alert.alert(
      `Pedido de ${userName}`,
      `Estado actual: ${STATUS_CONFIG[currentStatus]?.label ?? currentStatus}\n\n¿Cambiar a?`,
      options as any
    );
  };

  const filteredOrders = orders?.filter((o) =>
    filterStatus === "all" ? true : o.status === filterStatus
  ) ?? [];

  const pendingCount = orders?.filter((o) => o.status === "pending").length ?? 0;

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Pedidos VIP</Text>
            {pendingCount > 0 && (
              <Text style={styles.pendingAlert}>⚠️ {pendingCount} pedido{pendingCount > 1 ? "s" : ""} pendiente{pendingCount > 1 ? "s" : ""}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()}>
            <Text style={styles.refreshBtnText}>↻ Actualizar</Text>
          </TouchableOpacity>
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === "all" && styles.filterTabActive]}
            onPress={() => setFilterStatus("all")}
          >
            <Text style={[styles.filterTabText, filterStatus === "all" && styles.filterTabTextActive]}>
              Todos ({orders?.length ?? 0})
            </Text>
          </TouchableOpacity>
          {STATUS_ORDER.map((s) => {
            const count = orders?.filter((o) => o.status === s).length ?? 0;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.filterTab, filterStatus === s && styles.filterTabActive, { borderColor: STATUS_CONFIG[s].color + "44" }]}
                onPress={() => setFilterStatus(s)}
              >
                <Text style={[styles.filterTabText, filterStatus === s && { color: STATUS_CONFIG[s].color }]}>
                  {STATUS_CONFIG[s].icon} {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#C9A84C" />
            <Text style={styles.loadingText}>Cargando pedidos...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🍾</Text>
                <Text style={styles.emptyTitle}>Sin pedidos</Text>
                <Text style={styles.emptySubtitle}>
                  {filterStatus === "all"
                    ? "Los pedidos VIP aparecerán aquí cuando los invitados los realicen"
                    : `No hay pedidos con estado "${STATUS_CONFIG[filterStatus]?.label}"`}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const cfg = STATUS_CONFIG[item.status ?? "pending"];
              let parsedItems: Array<{ name: string; quantity: number }> = [];
              try {
                parsedItems = JSON.parse(item.items ?? "[]");
              } catch {
                parsedItems = [];
              }
              return (
                <View style={[styles.orderCard, { borderLeftColor: cfg.color, borderLeftWidth: 3 }]}>
                  <View style={styles.orderCardHeader}>
                    <View style={styles.orderCardLeft}>
                      <Text style={styles.orderNumber}>Pedido #{item.id}</Text>
                      <Text style={styles.orderTime}>
                        {new Date(item.createdAt).toLocaleTimeString("es-MX", {
                          hour: "2-digit", minute: "2-digit",
                        })} · {new Date(item.createdAt).toLocaleDateString("es-MX", {
                          day: "numeric", month: "short",
                        })}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.statusText, { color: cfg.color }]}>
                        {cfg.icon} {cfg.label}
                      </Text>
                    </View>
                  </View>

                  {/* Items */}
                  <View style={styles.itemsList}>
                    {parsedItems.length > 0 ? parsedItems.map((it, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemName}>{it.name}</Text>
                        <View style={styles.itemQtyBadge}>
                          <Text style={styles.itemQty}>x{it.quantity}</Text>
                        </View>
                      </View>
                    )) : (
                      <Text style={styles.itemsRaw}>{item.items}</Text>
                    )}
                  </View>

                  {item.notes && (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesLabel}>📝 Nota:</Text>
                      <Text style={styles.notesText}>{item.notes}</Text>
                    </View>
                  )}

                  {/* Action button */}
                  {item.status !== "delivered" && item.status !== "cancelled" && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: cfg.color + "22", borderColor: cfg.color + "44" }]}
                      onPress={() => handleUpdateStatus(item.id, item.status ?? "pending", `Usuario #${item.userId}`)}
                      disabled={updateStatus.isPending}
                    >
                      <Text style={[styles.actionBtnText, { color: cfg.color }]}>
                        {updateStatus.isPending ? "Actualizando..." : "Cambiar estado →"}
                      </Text>
                    </TouchableOpacity>
                  )}
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
    gap: 12,
  },
  loadingText: {
    color: "#8A7A5A",
    fontSize: 13,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
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
  pendingAlert: {
    fontSize: 12,
    color: "#F39C12",
    marginTop: 4,
    fontWeight: "600",
  },
  refreshBtn: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  refreshBtnText: {
    color: "#C9A84C",
    fontSize: 13,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 6,
    flexWrap: "wrap",
  },
  filterTab: {
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  filterTabActive: {
    backgroundColor: "#C9A84C22",
    borderColor: "#C9A84C",
  },
  filterTabText: {
    color: "#8A7A5A",
    fontSize: 12,
    fontWeight: "600",
  },
  filterTabTextActive: {
    color: "#C9A84C",
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
  orderCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 12,
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderCardLeft: {
    gap: 2,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  orderTime: {
    fontSize: 11,
    color: "#8A7A5A",
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  itemsList: {
    gap: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0A0A0A",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  itemName: {
    color: "#F5E6C8",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  itemQtyBadge: {
    backgroundColor: "#C9A84C22",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  itemQty: {
    color: "#C9A84C",
    fontSize: 12,
    fontWeight: "700",
  },
  itemsRaw: {
    color: "#8A7A5A",
    fontSize: 12,
    lineHeight: 18,
  },
  notesBox: {
    backgroundColor: "#0A0A0A",
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
  },
  notesLabel: {
    fontSize: 12,
    color: "#C9A84C",
    fontWeight: "600",
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    color: "#8A7A5A",
    lineHeight: 18,
  },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
