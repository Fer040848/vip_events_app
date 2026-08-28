import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { createVipOrdersCsv } from "@/lib/vip-order-export";
import { useAuth } from "@/hooks/use-auth";
import { useAdminOfflineCache } from "@/lib/admin-offline-cache";
import { AdminOfflineBanner } from "@/components/admin-data-state";
import { getPendingOrderChanges, hasInternetConnection, queueOrderStatusChange } from "@/lib/pending-order-sync";
import { usePendingOrderSync } from "@/hooks/use-pending-order-sync";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: "Pendiente", color: "#F39C12", bg: "#F39C1222", icon: "⏳" },
  confirmed: { label: "Confirmado", color: "#3498DB", bg: "#3498DB22", icon: "✅" },
  delivered: { label: "Entregado", color: "#27AE60", bg: "#27AE6022", icon: "🚀" },
  cancelled: { label: "Cancelado", color: "#C0392B", bg: "#C0392B22", icon: "❌" },
};

const STATUS_ORDER = ["pending", "confirmed", "delivered", "cancelled"] as const;
const DATE_RANGES = [
  { id: "all", label: "Todo" },
  { id: "today", label: "Hoy" },
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
] as const;
type DateRange = (typeof DATE_RANGES)[number]["id"];

export default function AdminOrdersScreen() {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [isExporting, setIsExporting] = useState(false);
  const [queuedOrderIds, setQueuedOrderIds] = useState<number[]>([]);

  const ordersQuery = trpc.vipOrders.getAllOrders.useQuery(undefined, {
    refetchInterval: 10000, // Poll every 10s
  });
  const productsQuery = trpc.vipProducts.list.useQuery();
  const liveOrderData = useMemo(() => {
    if (!ordersQuery.data || !productsQuery.data) return undefined;
    return { orders: ordersQuery.data, products: productsQuery.data };
  }, [ordersQuery.data, productsQuery.data]);
  const offlineCache = useAdminOfflineCache({
    accountId: user?.id,
    scope: "vip-orders",
    liveData: liveOrderData,
  });
  const orderData = liveOrderData ?? offlineCache.cachedData;
  const orders = orderData?.orders ?? [];
  const products = orderData?.products ?? [];
  const isLoading = !orderData && (ordersQuery.isLoading || productsQuery.isLoading || offlineCache.isCacheLoading);
  const hasDataError = Boolean(ordersQuery.error || productsQuery.error);
  const isOffline = Boolean(!liveOrderData && offlineCache.cachedData && hasDataError);

  const refreshOrders = useCallback(async () => {
    await Promise.all([ordersQuery.refetch(), productsQuery.refetch()]);
  }, [ordersQuery.refetch, productsQuery.refetch]);

  const refreshQueuedOrders = useCallback(async () => {
    if (!user?.id) return;
    const changes = await getPendingOrderChanges(user.id);
    setQueuedOrderIds(changes.map((change) => change.orderId));
  }, [user?.id]);

  const handleQueuedOrdersSynced = useCallback(async () => {
    await refreshQueuedOrders();
    await refreshOrders();
  }, [refreshOrders, refreshQueuedOrders]);

  const { sync: syncQueuedOrders } = usePendingOrderSync(user?.id, handleQueuedOrdersSynced);

  useEffect(() => {
    void refreshQueuedOrders();
  }, [refreshQueuedOrders]);

  const updateStatus = trpc.vipOrders.updateStatus.useMutation({
    onSuccess: () => ordersQuery.refetch(),
  });

  const submitOrderStatusChange = async (id: number, status: (typeof STATUS_ORDER)[number]) => {
    if (!user?.id) return;

    const queueChange = async () => {
      const pending = await queueOrderStatusChange(user.id, { orderId: id, status });
      setQueuedOrderIds(pending.map((change) => change.orderId));
      Alert.alert(
        "Cambio preparado",
        "El estado se guardó de forma segura y se enviará automáticamente al recuperar conexión.",
      );
    };

    try {
      if (!await hasInternetConnection()) {
        await queueChange();
        return;
      }
      await updateStatus.mutateAsync({ id, status });
      await refreshQueuedOrders();
    } catch {
      await queueChange();
    }
  };

  const handleUpdateStatus = (id: number, currentStatus: string, userName: string) => {
    const nextStatuses = STATUS_ORDER.filter((s) => s !== currentStatus && s !== "cancelled");
    const options = nextStatuses.map((s) => ({
      text: `${STATUS_CONFIG[s].icon} ${STATUS_CONFIG[s].label}`,
      onPress: () => void submitOrderStatusChange(id, s),
    }));
    options.push({ text: "❌ Cancelar pedido", onPress: () => void submitOrderStatusChange(id, "cancelled") });
    options.push({ text: "Cerrar", onPress: () => {} });

    Alert.alert(
      `Pedido de ${userName}`,
      `Estado actual: ${STATUS_CONFIG[currentStatus]?.label ?? currentStatus}\n\n¿Cambiar a?`,
      options as any
    );
  };

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const minimumDate = new Date(todayStart);
    if (dateRange === "7d") minimumDate.setDate(minimumDate.getDate() - 6);
    if (dateRange === "30d") minimumDate.setDate(minimumDate.getDate() - 29);

    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      const inRange = dateRange === "all"
        ? true
        : dateRange === "today"
          ? orderDate >= todayStart
          : orderDate >= minimumDate;
      return inRange && (filterStatus === "all" || order.status === filterStatus);
    });
  }, [dateRange, filterStatus, orders]);

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  const exportOrders = async (ordersToExport: typeof filteredOrders, fileScope: "vista" | "completo") => {
    if (ordersToExport.length === 0) {
      Alert.alert("Sin pedidos", "No hay pedidos para exportar con este filtro.");
      return;
    }

    setIsExporting(true);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `afterroom-pedidos-${fileScope}-${dateStamp}.csv`;
    const csv = createVipOrdersCsv(ordersToExport, products);

    try {
      if (Platform.OS === "web") {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(url);
      } else {
        const fileUri = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            dialogTitle: "Exportar pedidos VIP",
            mimeType: "text/csv",
            UTI: "public.comma-separated-values-text",
          });
        } else {
          Alert.alert("Exportación lista", `El archivo ${fileName} quedó preparado en el dispositivo.`);
        }
      }
    } catch {
      Alert.alert("Error", "No se pudo generar el archivo CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.container}>
        {/* Header */}
        {isOffline ? <AdminOfflineBanner cachedAt={offlineCache.cachedAt} isRefreshing={ordersQuery.isFetching || productsQuery.isFetching} onRetry={refreshOrders} /> : null}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Pedidos VIP</Text>
            {pendingCount > 0 && (
              <Text style={styles.pendingAlert}>⚠️ {pendingCount} pedido{pendingCount > 1 ? "s" : ""} pendiente{pendingCount > 1 ? "s" : ""}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => void refreshOrders()}>
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
              Todos ({orders.length})
            </Text>
          </TouchableOpacity>
          {STATUS_ORDER.map((s) => {
            const count = orders.filter((o) => o.status === s).length;
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

        <View style={styles.dateFilterSection}>
          <Text style={styles.dateFilterLabel}>Filtrar por fecha</Text>
          <View style={styles.dateFilterRow}>
            {DATE_RANGES.map((range) => (
              <TouchableOpacity
                key={range.id}
                style={[styles.dateFilter, dateRange === range.id && styles.dateFilterActive]}
                onPress={() => setDateRange(range.id)}
              >
                <Text style={[styles.dateFilterText, dateRange === range.id && styles.dateFilterTextActive]}>{range.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.exportRow}>
          <TouchableOpacity
            style={[styles.exportButton, (isExporting || filteredOrders.length === 0) && styles.exportButtonDisabled]}
            onPress={() => exportOrders(filteredOrders, "vista")}
            disabled={isExporting || filteredOrders.length === 0}
          >
            <Text style={styles.exportButtonText}>{isExporting ? "Generando..." : `Exportar vista (${filteredOrders.length})`}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportAllButton, (isExporting || !orders.length) && styles.exportButtonDisabled]}
            onPress={() => exportOrders(orders, "completo")}
            disabled={isExporting || !orders.length}
          >
            <Text style={styles.exportAllButtonText}>CSV completo</Text>
          </TouchableOpacity>
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
              let parsedItems: string[] = [];
              try {
                const rawItems: unknown = JSON.parse(item.items ?? "[]");
                parsedItems = Array.isArray(rawItems) ? rawItems.map(String) : [];
              } catch {
                parsedItems = [];
              }
              return (
                <View style={[styles.orderCard, { borderLeftColor: cfg.color, borderLeftWidth: 3 }]}>
                  <View style={styles.orderCardHeader}>
                    <View style={styles.orderCardLeft}>
                      <Text style={styles.orderNumber}>Pedido #{item.id}</Text>
                      <Text style={styles.memberName}>
                        {item.userName ?? item.userCode?.replace("code_", "") ?? `Usuario #${item.userId}`}
                      </Text>
                      <Text style={styles.eventName}>{item.eventTitle ?? "Evento VIP"}</Text>
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
                    {parsedItems.length > 0 ? parsedItems.map((itemId, idx) => {
                      const product = products.find((candidate) => candidate.id.toString() === itemId);
                      return (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemName}>{product?.name ?? "Producto VIP"}</Text>
                        <View style={styles.itemQtyBadge}>
                          <Text style={styles.itemQty}>$ {product ? Number(product.price).toFixed(2) : "—"}</Text>
                        </View>
                      </View>
                      );
                    }) : (
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
                      onPress={() => handleUpdateStatus(item.id, item.status ?? "pending", item.userName ?? `Usuario #${item.userId}`)}
                      disabled={updateStatus.isPending}
                    >
                      <Text style={[styles.actionBtnText, { color: cfg.color }]}> 
                        {updateStatus.isPending
                          ? "Actualizando..."
                          : queuedOrderIds.includes(item.id)
                            ? "Cambio pendiente de envío"
                            : "Cambiar estado →"}
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
  dateFilterSection: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  dateFilterLabel: {
    color: "#8A7A5A",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  dateFilterRow: {
    flexDirection: "row",
    gap: 8,
  },
  dateFilter: {
    flex: 1,
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 8,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  dateFilterActive: {
    backgroundColor: "#C9A84C22",
    borderColor: "#C9A84C",
  },
  dateFilterText: {
    color: "#8A7A5A",
    fontSize: 11,
    fontWeight: "700",
  },
  dateFilterTextActive: {
    color: "#C9A84C",
  },
  exportRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  exportButton: {
    flex: 1,
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 11,
    backgroundColor: "#C9A84C",
  },
  exportButtonText: {
    color: "#0A0A0A",
    fontSize: 12,
    fontWeight: "800",
  },
  exportAllButton: {
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#C9A84C55",
  },
  exportAllButtonText: {
    color: "#C9A84C",
    fontSize: 12,
    fontWeight: "800",
  },
  exportButtonDisabled: {
    opacity: 0.45,
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
  memberName: {
    fontSize: 13,
    color: "#F5E6C8",
    fontWeight: "600",
    marginTop: 3,
  },
  eventName: {
    fontSize: 11,
    color: "#C9A84C",
    marginTop: 2,
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
