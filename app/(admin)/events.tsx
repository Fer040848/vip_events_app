import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";

type EventForm = {
  title: string;
  description: string;
  date: string;
  location: string;
  locationInstructions: string;
  price: string;
  maxGuests: string;
  mercadoPagoLink: string;
  status: "draft" | "published" | "cancelled" | "completed";
};

const EMPTY_FORM: EventForm = {
  title: "",
  description: "",
  date: "",
  location: "",
  locationInstructions: "",
  price: "500",
  maxGuests: "40",
  mercadoPagoLink: "",
  status: "draft",
};

export default function AdminEventsScreen() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);

  const { data: events, isLoading, refetch } = trpc.events.listAll.useQuery();

  const createEvent = trpc.events.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowForm(false);
      setForm(EMPTY_FORM);
      Alert.alert("✅ Evento creado", "El evento ha sido creado exitosamente.");
    },
    onError: (err) => Alert.alert("Error", err.message),
  });

  const updateEvent = trpc.events.update.useMutation({
    onSuccess: () => {
      refetch();
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      Alert.alert("✅ Evento actualizado", "Los cambios han sido guardados.");
    },
    onError: (err) => Alert.alert("Error", err.message),
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const handleOpenEdit = (event: any) => {
    setEditingId(event.id);
    setForm({
      title: event.title ?? "",
      description: event.description ?? "",
      date: event.date ? new Date(event.date).toISOString().slice(0, 16) : "",
      location: event.location ?? "",
      locationInstructions: event.locationInstructions ?? "",
      price: event.price ?? "500",
      maxGuests: event.maxGuests?.toString() ?? "40",
      mercadoPagoLink: event.mercadoPagoLink ?? "",
      status: event.status ?? "draft",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      Alert.alert("Error", "El título es requerido");
      return;
    }
    if (!form.date.trim()) {
      Alert.alert("Error", "La fecha es requerida");
      return;
    }
    const payload = {
      title: form.title,
      description: form.description || undefined,
      date: new Date(form.date).toISOString(),
      location: form.location || undefined,
      locationInstructions: form.locationInstructions || undefined,
      price: form.price || undefined,
      maxGuests: form.maxGuests ? parseInt(form.maxGuests) : undefined,
      mercadoPagoLink: form.mercadoPagoLink || undefined,
      status: form.status,
    };
    if (editingId) {
      updateEvent.mutate({ id: editingId, ...payload });
    } else {
      createEvent.mutate(payload);
    }
  };

  const STATUS_COLORS: Record<string, string> = {
    published: "#27AE60",
    draft: "#F39C12",
    cancelled: "#C0392B",
    completed: "#8A7A5A",
  };

  const STATUS_LABELS: Record<string, string> = {
    published: "Publicado",
    draft: "Borrador",
    cancelled: "Cancelado",
    completed: "Completado",
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gestión de Eventos</Text>
          <TouchableOpacity style={styles.createBtn} onPress={handleOpenCreate}>
            <Text style={styles.createBtnText}>+ Crear</Text>
          </TouchableOpacity>
        </View>

        {/* Events List */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#C9A84C" />
          </View>
        ) : (
          <FlatList
            data={events ?? []}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 20, gap: 12 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyTitle}>No hay eventos</Text>
                <Text style={styles.emptySubtitle}>Crea tu primer evento VIP</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.eventCard}>
                <View style={styles.eventCardHeader}>
                  <Text style={styles.eventCardTitle} numberOfLines={2}>{item.title}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${STATUS_COLORS[item.status ?? "draft"]}22` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: STATUS_COLORS[item.status ?? "draft"] },
                      ]}
                    >
                      {STATUS_LABELS[item.status ?? "draft"]}
                    </Text>
                  </View>
                </View>
                <View style={styles.eventCardDetails}>
                  <Text style={styles.eventCardDate}>
                    📅 {new Date(item.date).toLocaleDateString("es-MX", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  {item.location && (
                    <Text style={styles.eventCardLocation} numberOfLines={1}>
                      📍 {item.location}
                    </Text>
                  )}
                  <View style={styles.eventCardFooter}>
                    <Text style={styles.eventCardPrice}>${item.price ?? "500"} MXN</Text>
                    {item.maxGuests && (
                      <Text style={styles.eventCardGuests}>
                        👥 Máx. {item.maxGuests} invitados
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => handleOpenEdit(item)}
                >
                  <Text style={styles.editBtnText}>✏️ Editar evento</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        {/* Create/Edit Modal */}
        <Modal
          visible={showForm}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowForm(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? "Editar Evento" : "Crear Evento"}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowForm(false)}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <FormField
                label="Título del evento *"
                value={form.title}
                onChangeText={(v) => setForm({ ...form, title: v })}
                placeholder="Ej: Fiesta VIP de Verano 2026"
              />
              <FormField
                label="Descripción"
                value={form.description}
                onChangeText={(v) => setForm({ ...form, description: v })}
                placeholder="Descripción del evento..."
                multiline
              />
              <FormField
                label="Fecha y hora *"
                value={form.date}
                onChangeText={(v) => setForm({ ...form, date: v })}
                placeholder="YYYY-MM-DDTHH:MM (ej: 2026-03-15T20:00)"
              />
              <FormField
                label="Ubicación"
                value={form.location}
                onChangeText={(v) => setForm({ ...form, location: v })}
                placeholder="Ej: Av. Reforma 123, CDMX"
              />
              <FormField
                label="Indicaciones de llegada"
                value={form.locationInstructions}
                onChangeText={(v) => setForm({ ...form, locationInstructions: v })}
                placeholder="Instrucciones para llegar al venue..."
                multiline
              />
              <FormField
                label="Precio (MXN)"
                value={form.price}
                onChangeText={(v) => setForm({ ...form, price: v })}
                placeholder="500"
                keyboardType="numeric"
              />
              <FormField
                label="Máximo de invitados"
                value={form.maxGuests}
                onChangeText={(v) => setForm({ ...form, maxGuests: v })}
                placeholder="40"
                keyboardType="numeric"
              />
              <FormField
                label="Link de MercadoPago"
                value={form.mercadoPagoLink}
                onChangeText={(v) => setForm({ ...form, mercadoPagoLink: v })}
                placeholder="https://mpago.la/..."
                autoCapitalize="none"
              />

              {/* Status Selector */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Estado del evento</Text>
                <View style={styles.statusSelector}>
                  {(["draft", "published", "cancelled", "completed"] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.statusOption,
                        form.status === s && {
                          backgroundColor: `${STATUS_COLORS[s]}22`,
                          borderColor: STATUS_COLORS[s],
                        },
                      ]}
                      onPress={() => setForm({ ...form, status: s })}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          form.status === s && { color: STATUS_COLORS[s], fontWeight: "700" },
                        ]}
                      >
                        {STATUS_LABELS[s]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (createEvent.isPending || updateEvent.isPending) && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={createEvent.isPending || updateEvent.isPending}
              >
                {createEvent.isPending || updateEvent.isPending ? (
                  <ActivityIndicator color="#0A0A0A" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingId ? "Guardar cambios" : "Crear evento"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </ScreenContainer>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A7A5A"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "sentences"}
      />
    </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F5E6C8",
  },
  createBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createBtnText: {
    color: "#0A0A0A",
    fontSize: 14,
    fontWeight: "700",
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
  },
  eventCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 12,
  },
  eventCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  eventCardTitle: {
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
  eventCardDetails: {
    gap: 6,
  },
  eventCardDate: {
    fontSize: 12,
    color: "#C9A84C",
    textTransform: "capitalize",
  },
  eventCardLocation: {
    fontSize: 12,
    color: "#8A7A5A",
  },
  eventCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventCardPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  eventCardGuests: {
    fontSize: 12,
    color: "#8A7A5A",
  },
  editBtn: {
    backgroundColor: "#2A2A2A",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  editBtnText: {
    color: "#F5E6C8",
    fontSize: 13,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F5E6C8",
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  modalCloseBtnText: {
    color: "#F5E6C8",
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 16,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#C9A84C",
    letterSpacing: 0.3,
  },
  fieldInput: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 14,
    color: "#F5E6C8",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  fieldInputMultiline: {
    height: 80,
    textAlignVertical: "top",
  },
  statusSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusOption: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  statusOptionText: {
    fontSize: 12,
    color: "#8A7A5A",
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 40,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#0A0A0A",
    fontSize: 16,
    fontWeight: "700",
  },
});
