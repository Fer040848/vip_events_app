import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  FlatList,
  Linking,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { usePayments } from "@/hooks/use-payments";
import { useAuth } from "@/hooks/use-auth";
import * as Haptics from "expo-haptics";

export default function PaymentsScreen() {
  const { user } = useAuth();
  const {
    loading,
    error,
    getPaymentLink,
    setPaymentLink,
    getEventPayments,
  } = usePayments();

  const [paymentLink, setCurrentPaymentLink] = useState("");
  const [newLink, setNewLink] = useState("");
  const [updating, setUpdating] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [eventId, setEventId] = useState("");

  useEffect(() => {
    loadPaymentLink();
  }, []);

  const loadPaymentLink = async () => {
    try {
      const link = await getPaymentLink();
      if (link) {
        setCurrentPaymentLink(link.url);
        setNewLink(link.url);
      }
    } catch (err) {
      console.error("Error loading payment link:", err);
    }
  };

  const handleUpdatePaymentLink = async () => {
    if (!newLink.trim()) {
      Alert.alert("Error", "Ingresa un URL de pago válido");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "Usuario no identificado");
      return;
    }

    setUpdating(true);
    try {
      await setPaymentLink(newLink.trim(), String(user.id), eventId || undefined);
      setCurrentPaymentLink(newLink);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Éxito", "Link de pago actualizado correctamente");
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setUpdating(false);
    }
  };

  const handleLoadPayments = async () => {
    if (!eventId.trim()) {
      Alert.alert("Error", "Ingresa un ID de evento");
      return;
    }

    try {
      const data = await getEventPayments(eventId);
      setPayments(data);
    } catch (err) {
      Alert.alert("Error", "No se pudieron cargar los pagos");
    }
  };

  const handleOpenPaymentLink = async () => {
    if (!paymentLink) {
      Alert.alert("Error", "No hay link de pago configurado");
      return;
    }

    const url = paymentLink.startsWith("http")
      ? paymentLink
      : `https://${paymentLink}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "No se puede abrir el link");
      }
    } catch (err) {
      Alert.alert("Error", "Error al abrir el link");
    }
  };

  const renderPaymentItem = ({ item }: { item: any }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View>
          <Text style={styles.paymentUser}>{item.userId}</Text>
          <Text style={styles.paymentAmount}>${item.amount}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "verified"
                  ? "#22C55E22"
                  : item.status === "paid"
                  ? "#F39C1222"
                  : "#EF444422",
            },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              {
                color:
                  item.status === "verified"
                    ? "#22C55E"
                    : item.status === "paid"
                    ? "#F39C12"
                    : "#EF4444",
              },
            ]}
          >
            {item.status === "verified"
              ? "✓ Verificado"
              : item.status === "paid"
              ? "⏳ Pendiente"
              : "✗ No pagado"}
          </Text>
        </View>
      </View>

      {item.proofUrl && (
        <TouchableOpacity
          style={styles.proofBtn}
          onPress={() => handleOpenPaymentLink()}
        >
          <Text style={styles.proofBtnText}>📸 Ver Comprobante</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScreenContainer className="bg-black">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Gestión de Pagos</Text>

        {/* Link de pago actual */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Link de Pago Actual</Text>

          {paymentLink ? (
            <View style={styles.linkCard}>
              <Text style={styles.linkText} numberOfLines={2}>
                {paymentLink}
              </Text>
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={handleOpenPaymentLink}
              >
                <Text style={styles.linkBtnText}>🔗 Abrir Link</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.emptyText}>No hay link de pago configurado</Text>
          )}
        </View>

        {/* Actualizar link de pago */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actualizar Link de Pago</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nuevo URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://mercadopago.com/..."
              placeholderTextColor="#555"
              value={newLink}
              onChangeText={setNewLink}
              editable={!updating}
            />
          </View>

          <TouchableOpacity
            style={[styles.updateBtn, updating && styles.updateBtnDisabled]}
            onPress={handleUpdatePaymentLink}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.updateBtnText}>💾 Guardar Link</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Ver pagos de evento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pagos por Evento</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ID del Evento</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: event123"
              placeholderTextColor="#555"
              value={eventId}
              onChangeText={setEventId}
            />
          </View>

          <TouchableOpacity
            style={styles.loadBtn}
            onPress={handleLoadPayments}
          >
            <Text style={styles.loadBtnText}>🔍 Cargar Pagos</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator color="#C9A84C" size="large" />
          ) : payments.length === 0 ? (
            <Text style={styles.emptyText}>No hay pagos para este evento</Text>
          ) : (
            <FlatList
              data={payments}
              renderItem={renderPaymentItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              nestedScrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#C9A84C",
    marginBottom: 24,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
  },
  linkCard: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 16,
  },
  linkText: {
    fontSize: 13,
    color: "#C9A84C",
    marginBottom: 12,
    fontFamily: "monospace",
  },
  linkBtn: {
    backgroundColor: "#C9A84C",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  linkBtnText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: "#C9A84C",
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#fff",
  },
  updateBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  updateBtnDisabled: {
    opacity: 0.6,
  },
  updateBtnText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
  },
  loadBtn: {
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  loadBtnText: {
    color: "#C9A84C",
    fontWeight: "600",
    fontSize: 14,
  },
  paymentCard: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  paymentUser: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#C9A84C",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  proofBtn: {
    backgroundColor: "#2a2a2a",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  proofBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C9A84C",
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 32,
  },
});
