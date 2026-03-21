import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useGuestsManagement } from "@/hooks/use-guests-management";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export default function AdminGuestsScreen() {
  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { guests, loading: guestsLoading, getPaymentStats, verifyPayment, rejectPayment, loadGuests } = useGuestsManagement();

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  const stats = getPaymentStats();

  const handleVerifyPayment = async (guestId: string) => {
    Alert.alert('Verificar Pago', '¿Confirmar que el pago fue verificado?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Verificar',
        onPress: async () => {
          try {
            setIsUpdating(true);
            await verifyPayment(guestId, notesText);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert('✅ Éxito', 'Pago verificado correctamente');
            setShowDetailsModal(false);
            setNotesText('');
          } catch (error) {
            Alert.alert('Error', 'No se pudo verificar el pago');
          } finally {
            setIsUpdating(false);
          }
        },
      },
    ]);
  };

  const handleRejectPayment = async (guestId: string) => {
    Alert.alert('Rechazar Pago', '¿Rechazar este pago?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Rechazar',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsUpdating(true);
            await rejectPayment(guestId, notesText);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
            Alert.alert('⚠️ Rechazado', 'Pago rechazado');
            setShowDetailsModal(false);
            setNotesText('');
          } catch (error) {
            Alert.alert('Error', 'No se pudo rechazar el pago');
          } finally {
            setIsUpdating(false);
          }
        },
      },
    ]);
  };

  const openGuestDetails = (guest: any) => {
    setSelectedGuest(guest);
    setNotesText(guest.notes || '');
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return '#22C55E';
      case 'rejected':
        return '#EF4444';
      default:
        return '#F59E0B';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'verified':
        return '✅ Verificado';
      case 'rejected':
        return '❌ Rechazado';
      default:
        return '⏳ Pendiente';
    }
  };

  const { data: users, isLoading: loadingUsers } = trpc.admin.users.useQuery();
  const { data: events } = trpc.events.listAll.useQuery();

  const { data: eventInvitations, isLoading: loadingInvitations } =
    trpc.invitations.getByEvent.useQuery(
      { eventId: selectedEventId! },
      { enabled: !!selectedEventId }
    );

  const markPaid = trpc.invitations.markPaid.useMutation({
    onSuccess: () => {
      Alert.alert("✅ Actualizado", "La invitación fue marcada como pagada.");
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  });

  const filteredUsers = (users ?? []).filter(
    (u) =>
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGuests = guests.filter((guest) => {
    const matchesSearch =
      guest.name.toLowerCase().includes(search.toLowerCase()) ||
      guest.code.toLowerCase().includes(search.toLowerCase()) ||
      guest.email?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filterStatus === 'all' || guest.paymentStatus === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendiente", color: "#F39C12" },
    paid: { label: "Pagado", color: "#27AE60" },
    checked_in: { label: "Check-in", color: "#3498DB" },
    cancelled: { label: "Cancelado", color: "#C0392B" },
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gestión de Invitados</Text>
          <Text style={styles.headerSubtitle}>
            {guests.length} usuarios registrados
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { borderColor: '#C9A84C' }]}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#22C55E' }]}>
            <Text style={styles.statLabel}>Verificados</Text>
            <Text style={[styles.statValue, { color: '#22C55E' }]}>{stats.verified}</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#F59E0B' }]}>
            <Text style={styles.statLabel}>Pendientes</Text>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending}</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#EF4444' }]}>
            <Text style={styles.statLabel}>Rechazados</Text>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.rejected}</Text>
          </View>
        </View>

        {/* Filter Status */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filtrar por estado:</Text>
          <View style={styles.filterChips}>
            {(['all', 'pending', 'verified', 'rejected'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  filterStatus === status && styles.filterChipActive,
                ]}
                onPress={() => setFilterStatus(status)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterStatus === status && styles.filterChipTextActive,
                  ]}
                >
                  {status === 'all' ? 'Todos' : getStatusLabel(status).split(' ')[1]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Event Filter */}
        <View style={styles.eventFilter}>
          <Text style={styles.filterLabel}>Filtrar por evento:</Text>
          <FlatList
            data={[{ id: null, title: "Todos" }, ...(events ?? [])]}
            keyExtractor={(item) => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedEventId === item.id && styles.filterChipActive,
                ]}
                onPress={() => setSelectedEventId(item.id as number | null)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedEventId === item.id && styles.filterChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre o email..."
            placeholderTextColor="#8A7A5A"
            autoCapitalize="none"
          />
        </View>

        {/* Content */}
        {selectedEventId ? (
          /* Event Invitations View */
          loadingInvitations ? (
            <View style={styles.centered}>
              <ActivityIndicator color="#C9A84C" />
            </View>
          ) : (
            <FlatList
              data={eventInvitations ?? []}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ padding: 20, gap: 10 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🎫</Text>
                  <Text style={styles.emptyTitle}>Sin invitaciones</Text>
                  <Text style={styles.emptySubtitle}>
                    Nadie se ha registrado para este evento aún
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const statusInfo = STATUS_LABELS[item.status] ?? {
                  label: item.status,
                  color: "#8A7A5A",
                };
                return (
                  <View style={styles.invitationCard}>
                    <View style={styles.invitationCardHeader}>
                      <View style={styles.guestAvatar}>
                        <Text style={styles.guestAvatarText}>
                          {(item as any).userName
                            ? (item as any).userName[0].toUpperCase()
                            : "?"}
                        </Text>
                      </View>
                      <View style={styles.guestInfo}>
                        <Text style={styles.guestName}>
                          {(item as any).userName ?? "Sin nombre"}
                        </Text>
                        <Text style={styles.guestEmail}>
                          {(item as any).userEmail ?? ""}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: `${statusInfo.color}22` },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.qrCode} numberOfLines={1}>
                      QR: {item.qrCode}
                    </Text>
                    {/* Status Actions */}
                    <View style={styles.statusActions}>
                      {(["pending", "paid", "checked_in", "cancelled"] as const).map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={[
                            styles.statusActionBtn,
                            item.status === s && {
                              backgroundColor: `${STATUS_LABELS[s].color}22`,
                              borderColor: STATUS_LABELS[s].color,
                            },
                          ]}
                          onPress={() => {
                            if (item.status !== s && s === "paid") {
                              markPaid.mutate({ id: item.id });
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.statusActionText,
                              item.status === s && {
                                color: STATUS_LABELS[s].color,
                                fontWeight: "700",
                              },
                            ]}
                          >
                            {STATUS_LABELS[s].label}
                          </Text>
                        </TouchableOpacity>
                       ))}
                    </View>
                  </View>
                );
              }}
            />
          )
        ) : (
          /* All Users View */
          loadingUsers ? (
            <View style={styles.centered}>
              <ActivityIndicator color="#C9A84C" />
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ padding: 20, gap: 10 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>👥</Text>
                  <Text style={styles.emptyTitle}>Sin usuarios</Text>
                  <Text style={styles.emptySubtitle}>No hay usuarios registrados aún</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.userCard}>
                  <View style={styles.guestAvatar}>
                    <Text style={styles.guestAvatarText}>
                      {item.name ? item.name[0].toUpperCase() : "?"}
                    </Text>
                  </View>
                  <View style={styles.guestInfo}>
                    <Text style={styles.guestName}>{item.name ?? "Sin nombre"}</Text>
                    <Text style={styles.guestEmail}>{item.email ?? ""}</Text>
                  </View>
                  <Text style={styles.userRole}>
                    {(item as any).role === "admin" ? "👑" : "👤"}
                  </Text>
                </View>
              )}
            />
          )
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
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
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
  eventFilter: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 12,
    color: "#8A7A5A",
    fontWeight: "600",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    maxWidth: 140,
  },
  filterChipActive: {
    backgroundColor: "#C9A84C22",
    borderColor: "#C9A84C",
  },
  filterChipText: {
    fontSize: 12,
    color: "#8A7A5A",
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#C9A84C",
    fontWeight: "700",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  searchInput: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 14,
    color: "#F5E6C8",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
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
  },
  invitationCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 10,
  },
  invitationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  guestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
  },
  guestAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0A0A0A",
  },
  guestInfo: {
    flex: 1,
    gap: 2,
  },
  guestName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  guestEmail: {
    fontSize: 11,
    color: "#8A7A5A",
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
  qrCode: {
    fontSize: 10,
    color: "#8A7A5A",
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },
  statusActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  statusActionBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#0A0A0A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  statusActionText: {
    fontSize: 11,
    color: "#8A7A5A",
    fontWeight: "600",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 12,
  },
  userRole: {
    fontSize: 20,
  },
  statsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center' as const,
  },
  statLabel: {
    fontSize: 11,
    color: '#8A7A5A',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#F5E6C8',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row' as const,
    gap: 8,
    flexWrap: 'wrap' as const,
  },
});
