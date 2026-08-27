import { AdminErrorState, AdminLoadingState } from "@/components/admin-data-state";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "#F39C12" },
  paid: { label: "Pagado", color: "#27AE60" },
  checked_in: { label: "Check-in", color: "#3498DB" },
  cancelled: { label: "Cancelado", color: "#C0392B" },
};

export default function AdminGuestsScreen() {
  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const usersQuery = trpc.admin.users.useQuery();
  const eventsQuery = trpc.events.listAll.useQuery();
  const invitationsQuery = trpc.invitations.getByEvent.useQuery(
    { eventId: selectedEventId ?? 0 },
    { enabled: selectedEventId !== null },
  );
  const markPaid = trpc.invitations.markPaid.useMutation({
    onSuccess: () => {
      void invitationsQuery.refetch();
      Alert.alert("Pago actualizado", "La invitación fue marcada como pagada.");
    },
    onError: (error) => Alert.alert("No se pudo actualizar", error.message),
  });

  const isLoading = usersQuery.isLoading || eventsQuery.isLoading || (selectedEventId !== null && invitationsQuery.isLoading);
  const hasError = Boolean(
    usersQuery.error || eventsQuery.error || (selectedEventId !== null && invitationsQuery.error),
  );

  const retry = async () => {
    await Promise.all([
      usersQuery.refetch(),
      eventsQuery.refetch(),
      selectedEventId !== null ? invitationsQuery.refetch() : Promise.resolve(),
    ]);
  };

  const users = usersQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const invitations = invitationsQuery.data ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = users.filter((user) =>
    !normalizedSearch || user.name?.toLowerCase().includes(normalizedSearch) || user.email?.toLowerCase().includes(normalizedSearch),
  );
  const filteredInvitations = invitations.filter((invitation) => {
    const name = String((invitation as any).userName ?? "").toLowerCase();
    const email = String((invitation as any).userEmail ?? "").toLowerCase();
    return !normalizedSearch || name.includes(normalizedSearch) || email.includes(normalizedSearch);
  });

  if (isLoading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <AdminLoadingState label="Sincronizando invitados y accesos…" />
      </ScreenContainer>
    );
  }

  if (hasError) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <AdminErrorState
          title="No pudimos cargar los invitados"
          description="No se realizaron cambios en las invitaciones. Comprueba la conexión y vuelve a intentarlo."
          onRetry={retry}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gestión de invitados</Text>
          <Text style={styles.headerSubtitle}>
            {selectedEventId !== null ? `${filteredInvitations.length} invitaciones del evento` : `${filteredUsers.length} usuarios registrados`}
          </Text>
        </View>

        <View style={styles.eventFilter}>
          <Text style={styles.filterLabel}>Filtrar por evento</Text>
          <FlatList
            data={[{ id: null, title: "Todos" }, ...events]}
            keyExtractor={(item) => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventFilterContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, selectedEventId === item.id && styles.filterChipActive]}
                onPress={() => setSelectedEventId(item.id as number | null)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, selectedEventId === item.id && styles.filterChipTextActive]} numberOfLines={1}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre o correo…"
            placeholderTextColor="#8A7A5A"
            autoCapitalize="none"
          />
        </View>

        {selectedEventId !== null ? (
          <FlatList
            data={filteredInvitations}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState title="Sin invitaciones" description="Nadie se ha registrado para este evento todavía." icon="🎫" />}
            renderItem={({ item }) => {
              const status = STATUS_LABELS[item.status] ?? { label: item.status, color: "#8A7A5A" };
              const isPaid = item.status === "paid" || item.status === "checked_in";
              return (
                <View style={styles.invitationCard}>
                  <View style={styles.rowHeader}>
                    <Avatar name={(item as any).userName} />
                    <View style={styles.personInfo}>
                      <Text style={styles.personName}>{(item as any).userName ?? "Sin nombre"}</Text>
                      <Text style={styles.personEmail}>{(item as any).userEmail ?? "Sin correo"}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.qrCode} numberOfLines={1}>QR: {item.qrCode}</Text>
                  {!isPaid ? (
                    <TouchableOpacity
                      style={[styles.paymentButton, markPaid.isPending && styles.paymentButtonDisabled]}
                      onPress={() => markPaid.mutate({ id: item.id })}
                      disabled={markPaid.isPending}
                      activeOpacity={0.78}
                    >
                      <Text style={styles.paymentButtonText}>Marcar como pagado</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            }}
          />
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState title="Sin usuarios" description="No hay usuarios registrados todavía." icon="👥" />}
            renderItem={({ item }) => (
              <View style={styles.userCard}>
                <Avatar name={item.name} />
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>{item.name ?? "Sin nombre"}</Text>
                  <Text style={styles.personEmail}>{item.email ?? "Sin correo"}</Text>
                </View>
                <Text style={styles.roleLabel}>{(item as any).role === "admin" ? "Admin" : "Usuario"}</Text>
              </View>
            )}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

function Avatar({ name }: { name?: string | null }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{name ? name.slice(0, 1).toUpperCase() : "?"}</Text>
    </View>
  );
}

function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14 },
  headerTitle: { color: "#F5E6C8", fontSize: 25, fontWeight: "800" },
  headerSubtitle: { color: "#8A7A5A", fontSize: 13, marginTop: 4 },
  eventFilter: { marginBottom: 10 },
  filterLabel: { color: "#8A7A5A", fontSize: 12, fontWeight: "700", paddingHorizontal: 20, marginBottom: 8 },
  eventFilterContent: { gap: 8, paddingHorizontal: 20 },
  filterChip: { backgroundColor: "#1A1A1A", borderColor: "#2A2A2A", borderRadius: 20, borderWidth: 1, maxWidth: 180, paddingHorizontal: 14, paddingVertical: 8 },
  filterChipActive: { backgroundColor: "#C9A84C20", borderColor: "#C9A84C" },
  filterChipText: { color: "#8A7A5A", fontSize: 12, fontWeight: "700" },
  filterChipTextActive: { color: "#C9A84C" },
  searchContainer: { paddingHorizontal: 20, paddingBottom: 8 },
  searchInput: { backgroundColor: "#1A1A1A", borderColor: "#2A2A2A", borderRadius: 12, borderWidth: 1, color: "#F5E6C8", fontSize: 14, paddingHorizontal: 14, paddingVertical: 12 },
  listContent: { gap: 10, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  invitationCard: { backgroundColor: "#1A1A1A", borderColor: "#2A2A2A", borderRadius: 16, borderWidth: 1, gap: 10, padding: 14 },
  userCard: { alignItems: "center", backgroundColor: "#1A1A1A", borderColor: "#2A2A2A", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 12, padding: 13 },
  rowHeader: { alignItems: "center", flexDirection: "row", gap: 12 },
  avatar: { alignItems: "center", backgroundColor: "#C9A84C", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  avatarText: { color: "#0A0A0A", fontSize: 18, fontWeight: "800" },
  personInfo: { flex: 1, gap: 2 },
  personName: { color: "#F5E6C8", fontSize: 14, fontWeight: "800" },
  personEmail: { color: "#8A7A5A", fontSize: 11 },
  roleLabel: { color: "#C9A84C", fontSize: 11, fontWeight: "800" },
  statusBadge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: "800" },
  qrCode: { color: "#8A7A5A", fontFamily: "monospace", fontSize: 10 },
  paymentButton: { alignItems: "center", backgroundColor: "#C9A84C", borderRadius: 9, paddingVertical: 10 },
  paymentButtonDisabled: { opacity: 0.55 },
  paymentButtonText: { color: "#0A0A0A", fontSize: 12, fontWeight: "800" },
  emptyState: { alignItems: "center", paddingHorizontal: 28, paddingTop: 62 },
  emptyIcon: { fontSize: 46 },
  emptyTitle: { color: "#F5E6C8", fontSize: 19, fontWeight: "800", marginTop: 10 },
  emptyDescription: { color: "#8A7A5A", fontSize: 13, lineHeight: 19, marginTop: 5, textAlign: "center" },
});
