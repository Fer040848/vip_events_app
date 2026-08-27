import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { getApiBaseUrl } from "@/constants/oauth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type PaymentStatus = "all" | "pending" | "approved" | "rejected";

const STATUS_LABELS: Record<Exclude<PaymentStatus, "all">, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export default function PaymentsScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState<PaymentStatus>("pending");
  const { data: confirmations = [], isLoading, refetch } = trpc.payments.getConfirmations.useQuery({});

  const reviewMutation = trpc.payments.approveConfirmation.useMutation({
    onSuccess: () => refetch(),
    onError: (error) => Alert.alert("No se pudo aprobar", error.message),
  });
  const rejectMutation = trpc.payments.rejectConfirmation.useMutation({
    onSuccess: () => refetch(),
    onError: (error) => Alert.alert("No se pudo rechazar", error.message),
  });

  const counts = useMemo(() => ({
    pending: confirmations.filter((item) => item.status === "pending").length,
    approved: confirmations.filter((item) => item.status === "approved").length,
    rejected: confirmations.filter((item) => item.status === "rejected").length,
  }), [confirmations]);

  const visibleConfirmations = useMemo(
    () => filter === "all" ? confirmations : confirmations.filter((item) => item.status === filter),
    [confirmations, filter]
  );

  const getProofUrl = (url: string) => url.startsWith("http") ? url : `${getApiBaseUrl()}${url}`;

  const approve = (confirmationId: number) => {
    Alert.alert(
      "Aprobar pago",
      "Al aprobar, la entrada del miembro se marcará como pagada y podrá usar su QR.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Aprobar", onPress: () => reviewMutation.mutate({ confirmationId }) },
      ]
    );
  };

  const reject = (confirmationId: number) => {
    Alert.alert(
      "Rechazar comprobante",
      "El miembro verá que necesita enviar un nuevo comprobante.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Rechazar", style: "destructive", onPress: () => rejectMutation.mutate({ confirmationId }) },
      ]
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={[styles.title, { color: colors.foreground }]}>Revisión de pagos</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Confirma los comprobantes enviados por miembros con acceso.</Text>
        </View>

        <View style={styles.metrics}>
          <Metric value={counts.pending} label="Pendientes" color={colors.primary} />
          <Metric value={counts.approved} label="Aprobados" color="#4CAF7D" />
          <Metric value={counts.rejected} label="Rechazados" color="#D96B6B" />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(["pending", "all", "approved", "rejected"] as PaymentStatus[]).map((status) => {
            const active = filter === status;
            return (
              <TouchableOpacity
                key={status}
                style={[styles.filterButton, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? `${colors.primary}18` : colors.surface }]}
                onPress={() => setFilter(status)}
              >
                <Text style={[styles.filterText, { color: active ? colors.primary : colors.muted }]}>
                  {status === "all" ? "Todos" : STATUS_LABELS[status]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.subtitle, { color: colors.muted }]}>Cargando comprobantes...</Text>
          </View>
        ) : visibleConfirmations.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={styles.emptyIcon}>✓</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sin comprobantes {filter === "all" ? "" : STATUS_LABELS[filter].toLowerCase()}</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>Las solicitudes enviadas por los miembros aparecerán aquí.</Text>
          </View>
        ) : (
          visibleConfirmations.map((confirmation) => {
            const statusColor = confirmation.status === "approved" ? "#4CAF7D" : confirmation.status === "rejected" ? "#D96B6B" : colors.primary;
            return (
              <View key={confirmation.id} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.foreground }]}>
                      {confirmation.userName ?? confirmation.userCode?.replace("code_", "") ?? `Usuario #${confirmation.userId}`}
                    </Text>
                    <Text style={[styles.eventTitle, { color: colors.muted }]}>{confirmation.eventTitle ?? "Evento VIP"}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}1A` }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[confirmation.status]}</Text>
                  </View>
                </View>

                <Image source={{ uri: getProofUrl(confirmation.screenshotUrl) }} style={[styles.proofImage, { borderColor: colors.border }]} resizeMode="cover" />
                <Text style={[styles.dateText, { color: colors.muted }]}>Recibido: {new Date(confirmation.submittedAt).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</Text>

                {confirmation.status === "pending" && (
                  <View style={styles.actions}>
                    <TouchableOpacity style={[styles.approveButton, { backgroundColor: colors.primary }]} onPress={() => approve(confirmation.id)} disabled={reviewMutation.isPending || rejectMutation.isPending}>
                      <Text style={styles.approveText}>Aprobar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.rejectButton, { borderColor: colors.border }]} onPress={() => reject(confirmation.id)} disabled={reviewMutation.isPending || rejectMutation.isPending}>
                      <Text style={[styles.rejectText, { color: colors.muted }]}>Rechazar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function Metric({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  intro: { marginBottom: 20 },
  title: { fontSize: 25, fontWeight: "800", letterSpacing: 0.2 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  metrics: { flexDirection: "row", justifyContent: "space-between", marginBottom: 22 },
  metric: { alignItems: "center", flex: 1 },
  metricValue: { fontSize: 24, fontWeight: "800" },
  metricLabel: { color: "#8A7A5A", fontSize: 11, fontWeight: "600", marginTop: 3 },
  filterRow: { gap: 8, paddingBottom: 18 },
  filterButton: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  filterText: { fontSize: 12, fontWeight: "700" },
  loadingState: { alignItems: "center", gap: 10, paddingTop: 48 },
  emptyState: { alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 28, gap: 8 },
  emptyIcon: { color: "#C9A84C", fontSize: 28, fontWeight: "800" },
  emptyTitle: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: "700" },
  eventTitle: { fontSize: 12, marginTop: 3 },
  statusBadge: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: "800" },
  proofImage: { width: "100%", height: 220, borderRadius: 10, borderWidth: 1, backgroundColor: "#0A0A0A" },
  dateText: { fontSize: 11, marginTop: 9 },
  actions: { flexDirection: "row", gap: 8, marginTop: 14 },
  approveButton: { flex: 1, alignItems: "center", borderRadius: 10, paddingVertical: 11 },
  approveText: { color: "#0A0A0A", fontSize: 13, fontWeight: "800" },
  rejectButton: { flex: 1, alignItems: "center", borderRadius: 10, borderWidth: 1, paddingVertical: 11 },
  rejectText: { fontSize: 13, fontWeight: "700" },
});
