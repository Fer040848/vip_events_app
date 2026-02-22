import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
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
  // Date parts
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
  location: string;
  locationInstructions: string;
  price: string;
  maxGuests: string;
  mercadoPagoLink: string;
  imageUrl: string;
  status: "draft" | "published" | "cancelled" | "completed";
};

const CURRENT_YEAR = new Date().getFullYear();

const EMPTY_FORM: EventForm = {
  title: "",
  description: "",
  day: String(new Date().getDate()),
  month: String(new Date().getMonth() + 1),
  year: String(CURRENT_YEAR),
  hour: "20",
  minute: "00",
  location: "",
  locationInstructions: "",
  price: "500",
  maxGuests: "40",
  mercadoPagoLink: "",
  imageUrl: "",
  status: "draft",
};

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function buildDateFromForm(form: EventForm): Date {
  const d = new Date(
    parseInt(form.year),
    parseInt(form.month) - 1,
    parseInt(form.day),
    parseInt(form.hour),
    parseInt(form.minute),
    0
  );
  return d;
}

function parseDateToForm(date: Date | string): Partial<EventForm> {
  const d = new Date(date);
  return {
    day: String(d.getDate()),
    month: String(d.getMonth() + 1),
    year: String(d.getFullYear()),
    hour: String(d.getHours()).padStart(2, "0"),
    minute: String(d.getMinutes()).padStart(2, "0"),
  };
}

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "email-address" | "url";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

function FormField({ label, value, onChangeText, placeholder, multiline, keyboardType, autoCapitalize }: FormFieldProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#555"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "sentences"}
        returnKeyType={multiline ? "default" : "done"}
      />
    </View>
  );
}

function DateTimePicker({ form, setForm }: { form: EventForm; setForm: (f: EventForm) => void }) {
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const months = MONTHS_ES.map((m, i) => ({ label: m, value: String(i + 1) }));
  const years = Array.from({ length: 5 }, (_, i) => String(CURRENT_YEAR + i));
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>📅 Fecha y hora del evento *</Text>
      <View style={styles.dateRow}>
        {/* Day */}
        <View style={styles.datePickerGroup}>
          <Text style={styles.datePickerLabel}>Día</Text>
          <ScrollView style={styles.dateScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            {days.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.dateOption, form.day === d && styles.dateOptionSelected]}
                onPress={() => setForm({ ...form, day: d })}
              >
                <Text style={[styles.dateOptionText, form.day === d && styles.dateOptionTextSelected]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {/* Month */}
        <View style={[styles.datePickerGroup, { flex: 2 }]}>
          <Text style={styles.datePickerLabel}>Mes</Text>
          <ScrollView style={styles.dateScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            {months.map((m) => (
              <TouchableOpacity
                key={m.value}
                style={[styles.dateOption, form.month === m.value && styles.dateOptionSelected]}
                onPress={() => setForm({ ...form, month: m.value })}
              >
                <Text style={[styles.dateOptionText, form.month === m.value && styles.dateOptionTextSelected]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {/* Year */}
        <View style={styles.datePickerGroup}>
          <Text style={styles.datePickerLabel}>Año</Text>
          <ScrollView style={styles.dateScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            {years.map((y) => (
              <TouchableOpacity
                key={y}
                style={[styles.dateOption, form.year === y && styles.dateOptionSelected]}
                onPress={() => setForm({ ...form, year: y })}
              >
                <Text style={[styles.dateOptionText, form.year === y && styles.dateOptionTextSelected]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
      {/* Time */}
      <View style={styles.timeRow}>
        <Text style={styles.datePickerLabel}>🕐 Hora</Text>
        <View style={styles.timeOptions}>
          {hours.map((h) => (
            <TouchableOpacity
              key={h}
              style={[styles.timeOption, form.hour === h && styles.dateOptionSelected]}
              onPress={() => setForm({ ...form, hour: h })}
            >
              <Text style={[styles.timeOptionText, form.hour === h && styles.dateOptionTextSelected]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.datePickerLabel}>Minutos</Text>
        <View style={styles.minuteOptions}>
          {minutes.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.minuteOption, form.minute === m && styles.dateOptionSelected]}
              onPress={() => setForm({ ...form, minute: m })}
            >
              <Text style={[styles.timeOptionText, form.minute === m && styles.dateOptionTextSelected]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {/* Preview */}
      <View style={styles.datePreview}>
        <Text style={styles.datePreviewText}>
          📅 {MONTHS_ES[parseInt(form.month) - 1]} {form.day}, {form.year} a las {form.hour}:{form.minute}
        </Text>
      </View>
    </View>
  );
}

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
    onError: (err) => Alert.alert("Error al crear", err.message),
  });

  const updateEvent = trpc.events.update.useMutation({
    onSuccess: () => {
      refetch();
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      Alert.alert("✅ Evento actualizado", "Los cambios han sido guardados.");
    },
    onError: (err) => Alert.alert("Error al actualizar", err.message),
  });

  const deleteEvent = trpc.events.delete.useMutation({
    onSuccess: () => {
      refetch();
      Alert.alert("🗑️ Evento eliminado");
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
    const dateParts = parseDateToForm(event.date);
    setForm({
      title: event.title ?? "",
      description: event.description ?? "",
      ...dateParts,
      day: dateParts.day ?? String(new Date().getDate()),
      month: dateParts.month ?? String(new Date().getMonth() + 1),
      year: dateParts.year ?? String(CURRENT_YEAR),
      hour: dateParts.hour ?? "20",
      minute: dateParts.minute ?? "00",
      location: event.location ?? "",
      locationInstructions: event.locationInstructions ?? "",
      price: event.price ?? "500",
      maxGuests: event.maxGuests?.toString() ?? "40",
      mercadoPagoLink: event.mercadoPagoLink ?? "",
      imageUrl: event.imageUrl ?? "",
      status: event.status ?? "draft",
    });
    setShowForm(true);
  };

  const handleDelete = (id: number, title: string) => {
    Alert.alert(
      "Eliminar evento",
      `¿Estás seguro de eliminar "${title}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => deleteEvent.mutate({ id }) },
      ]
    );
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      Alert.alert("Error", "El título es requerido");
      return;
    }
    const eventDate = buildDateFromForm(form);
    if (isNaN(eventDate.getTime())) {
      Alert.alert("Error", "La fecha no es válida");
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      date: eventDate.toISOString(),
      location: form.location.trim() || undefined,
      locationInstructions: form.locationInstructions.trim() || undefined,
      price: form.price || undefined,
      maxGuests: form.maxGuests ? parseInt(form.maxGuests) : undefined,
      mercadoPagoLink: form.mercadoPagoLink.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
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

  const isSaving = createEvent.isPending || updateEvent.isPending;

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gestión de Eventos</Text>
          <TouchableOpacity style={styles.createBtn} onPress={handleOpenCreate}>
            <Text style={styles.createBtnText}>+ Crear Evento</Text>
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
                <TouchableOpacity style={styles.createBtnLarge} onPress={handleOpenCreate}>
                  <Text style={styles.createBtnLargeText}>+ Crear Primer Evento</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.eventCard}>
                <View style={styles.eventCardHeader}>
                  <Text style={styles.eventCardTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[item.status ?? "draft"]}22` }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[item.status ?? "draft"] }]}>
                      {STATUS_LABELS[item.status ?? "draft"]}
                    </Text>
                  </View>
                </View>
                <View style={styles.eventCardDetails}>
                  <Text style={styles.eventCardDate}>
                    📅 {new Date(item.date).toLocaleDateString("es-MX", {
                      weekday: "short", day: "numeric", month: "short",
                      year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </Text>
                  {item.location && (
                    <Text style={styles.eventCardLocation} numberOfLines={1}>📍 {item.location}</Text>
                  )}
                  <View style={styles.eventCardFooter}>
                    <Text style={styles.eventCardPrice}>${item.price ?? "500"} MXN</Text>
                    {item.maxGuests && (
                      <Text style={styles.eventCardGuests}>👥 Máx. {item.maxGuests}</Text>
                    )}
                    {item.mercadoPagoLink && (
                      <View style={styles.mpBadge}>
                        <Text style={styles.mpBadgeText}>💳 MP</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.eventCardActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEdit(item)}>
                    <Text style={styles.editBtnText}>✏️ Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id, item.title)}
                  >
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        {/* Create/Edit Modal */}
        <Modal
          visible={showForm}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => !isSaving && setShowForm(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? "✏️ Editar Evento" : "✨ Crear Evento"}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => !isSaving && setShowForm(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
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

              {/* Date/Time Picker */}
              <DateTimePicker form={form} setForm={setForm} />

              <FormField
                label="📍 Ubicación"
                value={form.location}
                onChangeText={(v) => setForm({ ...form, location: v })}
                placeholder="Ej: Av. Reforma 123, CDMX"
              />
              <FormField
                label="🗺️ Indicaciones de llegada"
                value={form.locationInstructions}
                onChangeText={(v) => setForm({ ...form, locationInstructions: v })}
                placeholder="Instrucciones para llegar al venue..."
                multiline
              />
              <FormField
                label="💰 Precio (MXN)"
                value={form.price}
                onChangeText={(v) => setForm({ ...form, price: v })}
                placeholder="500"
                keyboardType="numeric"
              />
              <FormField
                label="👥 Máximo de invitados"
                value={form.maxGuests}
                onChangeText={(v) => setForm({ ...form, maxGuests: v })}
                placeholder="40"
                keyboardType="numeric"
              />
              <FormField
                label="💳 Link de MercadoPago"
                value={form.mercadoPagoLink}
                onChangeText={(v) => setForm({ ...form, mercadoPagoLink: v })}
                placeholder="https://mpago.la/..."
                autoCapitalize="none"
                keyboardType="url"
              />
              <FormField
                label="🖼️ URL de imagen del evento"
                value={form.imageUrl}
                onChangeText={(v) => setForm({ ...form, imageUrl: v })}
                placeholder="https://..."
                autoCapitalize="none"
                keyboardType="url"
              />

              {/* Status Selector */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>📊 Estado del evento</Text>
                <View style={styles.statusSelector}>
                  {(["draft", "published", "cancelled", "completed"] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.statusOption, form.status === s && styles.statusOptionSelected]}
                      onPress={() => setForm({ ...form, status: s })}
                    >
                      <Text style={[styles.statusOptionText, form.status === s && styles.statusOptionTextSelected]}>
                        {STATUS_LABELS[s]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {form.status === "draft" && (
                  <Text style={styles.statusHint}>💡 Cambia a "Publicado" para que los invitados puedan verlo</Text>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, isSaving && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#0A0A0A" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingId ? "💾 Guardar Cambios" : "✨ Crear Evento"}
                  </Text>
                )}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </Modal>
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
    flexDirection: "row",
    alignItems: "center",
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
  createBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  createBtnText: {
    color: "#0A0A0A",
    fontSize: 13,
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
  createBtnLarge: {
    backgroundColor: "#C9A84C",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  createBtnLargeText: {
    color: "#0A0A0A",
    fontSize: 15,
    fontWeight: "700",
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
    gap: 8,
  },
  eventCardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#F5E6C8",
    lineHeight: 22,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
  },
  eventCardLocation: {
    fontSize: 12,
    color: "#8A7A5A",
  },
  eventCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  eventCardPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  eventCardGuests: {
    fontSize: 12,
    color: "#8A7A5A",
  },
  mpBadge: {
    backgroundColor: "#00B1EA22",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#00B1EA44",
  },
  mpBadgeText: {
    color: "#00B1EA",
    fontSize: 10,
    fontWeight: "700",
  },
  eventCardActions: {
    flexDirection: "row",
    gap: 8,
  },
  editBtn: {
    flex: 1,
    backgroundColor: "#C9A84C22",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C9A84C44",
  },
  editBtnText: {
    color: "#C9A84C",
    fontSize: 13,
    fontWeight: "600",
  },
  deleteBtn: {
    backgroundColor: "#C0392B22",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C0392B44",
  },
  deleteBtnText: {
    fontSize: 16,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseBtnText: {
    color: "#8A7A5A",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 11,
    color: "#C9A84C",
    letterSpacing: 1,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  fieldInput: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#F5E6C8",
  },
  fieldInputMultiline: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  // Date picker
  dateRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  datePickerGroup: {
    flex: 1,
    gap: 4,
  },
  datePickerLabel: {
    fontSize: 10,
    color: "#8A7A5A",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateScroll: {
    height: 120,
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  dateOption: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  dateOptionSelected: {
    backgroundColor: "#C9A84C",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  dateOptionText: {
    color: "#8A7A5A",
    fontSize: 13,
  },
  dateOptionTextSelected: {
    color: "#0A0A0A",
    fontWeight: "700",
  },
  timeRow: {
    gap: 8,
    marginBottom: 12,
  },
  timeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  timeOption: {
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    minWidth: 44,
    alignItems: "center",
  },
  timeOptionText: {
    color: "#8A7A5A",
    fontSize: 13,
    fontWeight: "500",
  },
  minuteOptions: {
    flexDirection: "row",
    gap: 8,
  },
  minuteOption: {
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    alignItems: "center",
  },
  datePreview: {
    backgroundColor: "#C9A84C11",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#C9A84C33",
    marginTop: 4,
  },
  datePreviewText: {
    color: "#C9A84C",
    fontSize: 13,
    fontWeight: "600",
  },
  // Status selector
  statusSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusOption: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  statusOptionSelected: {
    backgroundColor: "#C9A84C",
    borderColor: "#C9A84C",
  },
  statusOptionText: {
    color: "#8A7A5A",
    fontSize: 13,
    fontWeight: "600",
  },
  statusOptionTextSelected: {
    color: "#0A0A0A",
    fontWeight: "700",
  },
  statusHint: {
    fontSize: 11,
    color: "#F39C12",
    marginTop: 8,
    lineHeight: 16,
  },
  submitBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#C9A84C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#0A0A0A",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
