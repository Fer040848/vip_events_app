import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";

const NOTIFICATION_TYPES = [
  { id: "general", label: "General", icon: "📢" },
  { id: "event_reminder", label: "Recordatorio", icon: "⏰" },
  { id: "location", label: "Ubicación", icon: "📍" },
  { id: "payment", label: "Pago", icon: "💳" },
  { id: "order", label: "Pedido VIP", icon: "👑" },
] as const;

export default function AdminNotificationsScreen() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedType, setSelectedType] = useState<
    "general" | "event_reminder" | "location" | "payment" | "order"
  >("general");
  const [selectedEventId, setSelectedEventId] = useState<number | undefined>(undefined);

  const [pushResult, setPushResult] = useState<{ sent: number; failed: number; total?: number } | null>(null);

  const { data: events } = trpc.events.listAll.useQuery();
  const { data: notifications, refetch } = trpc.notifications.list.useQuery();

  const sendNotification = trpc.notifications.send.useMutation({
    onSuccess: () => refetch(),
    onError: (err: any) => Alert.alert("Error", err.message),
  });

  const sendPush = trpc.push.sendToAll.useMutation({
    onSuccess: (result) => {
      setPushResult(result);
      refetch();
      setTitle("");
      setBody("");
      Alert.alert(
        "✅ Notificación enviada",
        `Push nativa: ${result.sent} enviadas, ${result.failed} fallidas.\nTotal de dispositivos: ${result.total}`,
        [{ text: "OK" }]
      );
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  });

  const handleSend = () => {
    if (!title.trim()) {
      Alert.alert("Error", "El título es requerido");
      return;
    }
    if (!body.trim()) {
      Alert.alert("Error", "El mensaje es requerido");
      return;
    }
    // Send both: in-app notification AND native push
    sendNotification.mutate({
      title: title.trim(),
      body: body.trim(),
      type: selectedType,
      eventId: selectedEventId,
    });
    sendPush.mutate({
      title: title.trim(),
      body: body.trim(),
    });
  };

  const isSending = sendNotification.isPending || sendPush.isPending;

  const TYPE_COLORS: Record<string, string> = {
    general: "#8A7A5A",
    event_reminder: "#3498DB",
    location: "#27AE60",
    payment: "#C9A84C",
    order: "#9B59B6",
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          <Text style={styles.headerSubtitle}>Envía alertas a todos los usuarios</Text>
        </View>

        <FlatList
          data={notifications ?? []}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.formSection}>
              {/* Compose Form */}
              <Text style={styles.sectionTitle}>Enviar nueva notificación</Text>

              {/* Type Selector */}
              <Text style={styles.fieldLabel}>Tipo</Text>
              <View style={styles.typeSelector}>
                {NOTIFICATION_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.typeChip,
                      selectedType === t.id && {
                        backgroundColor: `${TYPE_COLORS[t.id]}22`,
                        borderColor: TYPE_COLORS[t.id],
                      },
                    ]}
                    onPress={() => setSelectedType(t.id)}
                  >
                    <Text style={styles.typeChipIcon}>{t.icon}</Text>
                    <Text
                      style={[
                        styles.typeChipText,
                        selectedType === t.id && {
                          color: TYPE_COLORS[t.id],
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Event Selector */}
              <Text style={styles.fieldLabel}>Evento (opcional)</Text>
              <FlatList
                data={[{ id: undefined, title: "Sin evento" }, ...(events ?? [])]}
                keyExtractor={(item) => String(item.id)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, marginBottom: 16 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.eventChip,
                      selectedEventId === item.id && styles.eventChipActive,
                    ]}
                    onPress={() => setSelectedEventId(item.id as number | undefined)}
                  >
                    <Text
                      style={[
                        styles.eventChipText,
                        selectedEventId === item.id && styles.eventChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                )}
              />

              {/* Title */}
              <Text style={styles.fieldLabel}>Título *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Ej: ¡El evento comienza en 1 hora!"
                placeholderTextColor="#8A7A5A"
                maxLength={255}
              />

              {/* Body */}
              <Text style={styles.fieldLabel}>Mensaje *</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={body}
                onChangeText={setBody}
                placeholder="Escribe el mensaje que recibirán todos los invitados..."
                placeholderTextColor="#8A7A5A"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Quick Templates */}
              <Text style={styles.fieldLabel}>Plantillas rápidas</Text>
              <View style={styles.templates}>
                {[
                  {
                    title: "🎉 Evento esta noche",
                    body: "¡Tu evento VIP comienza esta noche! Recuerda traer tu QR de entrada.",
                    type: "event_reminder" as const,
                  },
                  {
                    title: "📍 Ubicación del evento",
                    body: "El evento se realizará en la dirección indicada. Sigue las indicaciones de llegada en la app.",
                    type: "location" as const,
                  },
                  {
                    title: "💳 Confirma tu pago",
                    body: "Recuerda completar tu pago para activar tu entrada VIP y acceder al evento.",
                    type: "payment" as const,
                  },
                  {
                    title: "⏰ Último aviso de pago",
                    body: "¡Quedan pocas horas! Completa tu pago de $500 MXN para no perder tu lugar en el evento VIP. Usa el link de MercadoPago en la app.",
                    type: "payment" as const,
                  },
                  {
                    title: "🎉 ¡Nos vemos esta noche!",
                    body: "El evento comienza pronto. Asegúrate de tener tu QR listo y llegar 15 minutos antes. ¡Será una noche increíble!",
                    type: "event_reminder" as const,
                  },
                  {
                    title: "👑 Servicio VIP disponible",
                    body: "Ya puedes hacer tus pedidos VIP desde la app. Champagne, mesa privada y más te esperan. ¡Disfruta la noche!",
                    type: "order" as const,
                  },
                ].map((t, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.templateBtn}
                    onPress={() => {
                      setTitle(t.title);
                      setBody(t.body);
                      setSelectedType(t.type);
                    }}
                  >
                    <Text style={styles.templateBtnText}>{t.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Send Button */}
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  isSending && styles.sendBtnDisabled,
                ]}
                onPress={handleSend}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator color="#0A0A0A" />
                ) : (
                  <Text style={styles.sendBtnText}>📢 Enviar push + notificación a todos</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.historyTitle}>Historial de notificaciones</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>Sin notificaciones enviadas</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const typeInfo = NOTIFICATION_TYPES.find((t) => t.id === item.type);
            return (
              <View style={styles.notifCard}>
                <View style={styles.notifCardHeader}>
                  <Text style={styles.notifTypeIcon}>{typeInfo?.icon ?? "📢"}</Text>
                  <View style={styles.notifCardInfo}>
                    <Text style={styles.notifCardTitle}>{item.title}</Text>
                    <Text style={styles.notifCardDate}>
                      {new Date(item.createdAt).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
                <Text style={styles.notifCardBody}>{item.body}</Text>
              </View>
            );
          }}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
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
  formSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F5E6C8",
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#C9A84C",
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  typeChipIcon: {
    fontSize: 14,
  },
  typeChipText: {
    fontSize: 12,
    color: "#8A7A5A",
    fontWeight: "600",
  },
  eventChip: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    maxWidth: 140,
  },
  eventChipActive: {
    backgroundColor: "#C9A84C22",
    borderColor: "#C9A84C",
  },
  eventChipText: {
    fontSize: 12,
    color: "#8A7A5A",
    fontWeight: "600",
  },
  eventChipTextActive: {
    color: "#C9A84C",
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 14,
    color: "#F5E6C8",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    marginBottom: 16,
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: "top",
  },
  templates: {
    gap: 8,
    marginBottom: 16,
  },
  templateBtn: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  templateBtnText: {
    fontSize: 13,
    color: "#F5E6C8",
    fontWeight: "600",
  },
  sendBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    color: "#0A0A0A",
    fontSize: 15,
    fontWeight: "700",
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F5E6C8",
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    color: "#8A7A5A",
    fontSize: 13,
  },
  notifCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 8,
  },
  notifCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  notifTypeIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  notifCardInfo: {
    flex: 1,
    gap: 2,
  },
  notifCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  notifCardDate: {
    fontSize: 11,
    color: "#8A7A5A",
    textTransform: "capitalize",
  },
  notifCardBody: {
    fontSize: 12,
    color: "#8A7A5A",
    lineHeight: 18,
  },
});
