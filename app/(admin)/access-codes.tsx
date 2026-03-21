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
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAccessCodes } from "@/hooks/use-access-codes";
import { useAuth } from "@/hooks/use-auth";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

export default function AccessCodesScreen() {
  const { user } = useAuth();
  const { codes, loading, error, fetchAllCodes, createCode, deactivateCode } =
    useAccessCodes();

  const [newCode, setNewCode] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAllCodes();
  }, []);

  const handleCreateCode = async () => {
    if (!newCode.trim()) {
      Alert.alert("Error", "Ingresa un código");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "Usuario no identificado");
      return;
    }

    setCreating(true);
    try {
      await createCode(newCode.toUpperCase(), role, String(user.id || ""));
      setNewCode("");
      setRole("user");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Éxito", "Código creado correctamente");
      await fetchAllCodes();
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", err instanceof Error ? err.message : "Error al crear código");
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert("Copiado", `Código ${code} copiado al portapapeles`);
  };

  const handleDeactivateCode = (codeId: string, code: string) => {
    Alert.alert(
      "Desactivar código",
      `¿Estás seguro de que deseas desactivar ${code}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desactivar",
          style: "destructive",
          onPress: async () => {
            try {
              await deactivateCode(codeId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err) {
              Alert.alert("Error", "No se pudo desactivar el código");
            }
          },
        },
      ]
    );
  };

  const renderCodeItem = ({ item }: { item: any }) => (
    <View style={styles.codeCard}>
      <View style={styles.codeHeader}>
        <View>
          <Text style={styles.codeValue}>{item.code}</Text>
          <Text style={styles.codeRole}>
            {item.role === "admin" ? "👑 Admin" : "👤 Usuario"}
          </Text>
        </View>
        <View style={styles.codeBadge}>
          <Text style={styles.codeBadgeText}>
            {item.isActive ? "✓ Activo" : "✗ Inactivo"}
          </Text>
        </View>
      </View>

      {item.usedBy && (
        <Text style={styles.codeUsed}>Usado por: {item.usedBy}</Text>
      )}

      <View style={styles.codeActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleCopyCode(item.code)}
        >
          <Text style={styles.actionBtnText}>📋 Copiar</Text>
        </TouchableOpacity>

        {item.isActive && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={() => handleDeactivateCode(item.id, item.code)}
          >
            <Text style={styles.actionBtnText}>🚫 Desactivar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <ScreenContainer className="bg-black">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Gestión de Códigos de Acceso</Text>

        {/* Crear nuevo código */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Crear Nuevo Código</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Código</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: VIP001"
              placeholderTextColor="#555"
              value={newCode}
              onChangeText={setNewCode}
              editable={!creating}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de Usuario</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleBtn,
                  role === "user" && styles.roleBtnActive,
                ]}
                onPress={() => setRole("user")}
              >
                <Text style={styles.roleBtnText}>👤 Usuario</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleBtn,
                  role === "admin" && styles.roleBtnActive,
                ]}
                onPress={() => setRole("admin")}
              >
                <Text style={styles.roleBtnText}>👑 Admin</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.createBtn, creating && styles.createBtnDisabled]}
            onPress={handleCreateCode}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.createBtnText}>+ Crear Código</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Lista de códigos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Códigos Activos ({codes.filter((c) => c.isActive).length})
          </Text>

          {loading ? (
            <ActivityIndicator color="#C9A84C" size="large" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : codes.length === 0 ? (
            <Text style={styles.emptyText}>No hay códigos creados</Text>
          ) : (
            <FlatList
              data={codes}
              renderItem={renderCodeItem}
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
    fontSize: 16,
    color: "#fff",
  },
  roleSelector: {
    flexDirection: "row",
    gap: 12,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    alignItems: "center",
  },
  roleBtnActive: {
    backgroundColor: "#C9A84C",
    borderColor: "#C9A84C",
  },
  roleBtnText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
  },
  createBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  createBtnDisabled: {
    opacity: 0.6,
  },
  createBtnText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
  },
  codeCard: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  codeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  codeValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#C9A84C",
    letterSpacing: 2,
  },
  codeRole: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  codeBadge: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  codeBadgeText: {
    fontSize: 11,
    color: "#C9A84C",
    fontWeight: "600",
  },
  codeUsed: {
    fontSize: 12,
    color: "#888",
    marginBottom: 12,
  },
  codeActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    alignItems: "center",
  },
  actionBtnDanger: {
    backgroundColor: "#3a2a2a",
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C9A84C",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 32,
  },
});
