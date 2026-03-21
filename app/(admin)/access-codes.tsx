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
  Modal,
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

  // Individual code creation
  const [newCode, setNewCode] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [creating, setCreating] = useState(false);

  // Batch code generation
  const [codePrefix, setCodePrefix] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isAdminBatch, setIsAdminBatch] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  // Tab selection
  const [activeTab, setActiveTab] = useState<"individual" | "batch">("individual");

  useEffect(() => {
    fetchAllCodes();
  }, []);

  // Handle individual code creation
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

  // Handle batch code generation
  const generateCodes = async () => {
    if (!codePrefix.trim()) {
      Alert.alert("Error", "Por favor ingresa un prefijo para los códigos");
      return;
    }

    const qty = parseInt(quantity) || 1;
    if (qty < 1 || qty > 100) {
      Alert.alert("Error", "La cantidad debe estar entre 1 y 100");
      return;
    }

    setIsGenerating(true);
    const newCodes: string[] = [];

    try {
      for (let i = 1; i <= qty; i++) {
        const code = `${codePrefix.toUpperCase()}${String(i).padStart(3, "0")}`;
        await createCode(code, isAdminBatch ? "admin" : "user", String(user?.id || "admin-user"));
        newCodes.push(code);
      }

      setGeneratedCodes(newCodes);
      setShowModal(true);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Reset form
      setCodePrefix("");
      setQuantity("1");
      setIsAdminBatch(false);

      // Reload codes
      await fetchAllCodes();
    } catch (err) {
      Alert.alert("Error", "No se pudieron generar los códigos");
      console.error("Error generating codes:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert("Copiado", `Código ${code} copiado al portapapeles`);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert("✅ Copiado", "Código copiado al portapapeles");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo copiar el código");
    }
  };

  const copyAllCodes = async () => {
    try {
      const codesText = generatedCodes.join("\n");
      await Clipboard.setStringAsync(codesText);
      Alert.alert("✅ Copiados", "Todos los códigos fueron copiados");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron copiar los códigos");
    }
  };

  const handleDeactivateCode = (codeId: number, code: string) => {
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

  const adminCodes = codes.filter((c) => c.role === "admin");
  const userCodes = codes.filter((c) => c.role === "user");

  return (
    <ScreenContainer className="bg-black">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Gestión de Códigos</Text>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "individual" && styles.tabActive]}
            onPress={() => setActiveTab("individual")}
          >
            <Text style={[styles.tabText, activeTab === "individual" && styles.tabTextActive]}>
              Individual
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "batch" && styles.tabActive]}
            onPress={() => setActiveTab("batch")}
          >
            <Text style={[styles.tabText, activeTab === "batch" && styles.tabTextActive]}>
              Lote
            </Text>
          </TouchableOpacity>
        </View>

        {/* Individual Code Creation */}
        {activeTab === "individual" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Crear Código Individual</Text>

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
        )}

        {/* Batch Code Generation */}
        {activeTab === "batch" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Generar Códigos en Lote</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prefijo del Código</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: TLC, VIP, GOLD"
                placeholderTextColor="#555"
                value={codePrefix}
                onChangeText={setCodePrefix}
                maxLength={10}
                autoCapitalize="characters"
              />
              <Text style={styles.hint}>Se generarán códigos como: TLC001, TLC002, etc.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cantidad de Códigos</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#555"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={styles.hint}>Máximo 100 códigos por lote</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Código</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[
                    styles.roleBtn,
                    !isAdminBatch && styles.roleBtnActive,
                  ]}
                  onPress={() => setIsAdminBatch(false)}
                >
                  <Text style={styles.roleBtnText}>👤 Usuario</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleBtn,
                    isAdminBatch && styles.roleBtnActive,
                  ]}
                  onPress={() => setIsAdminBatch(true)}
                >
                  <Text style={styles.roleBtnText}>👑 Admin</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.createBtn, isGenerating && styles.createBtnDisabled]}
              onPress={generateCodes}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.createBtnText}>✨ Generar Códigos</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={styles.statValue}>{codes.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Admin</Text>
              <Text style={[styles.statValue, { color: "#C9A84C" }]}>{adminCodes.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Usuario</Text>
              <Text style={[styles.statValue, { color: "#8A7A5A" }]}>{userCodes.length}</Text>
            </View>
          </View>
        </View>

        {/* Códigos List */}
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
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              nestedScrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Generated Codes Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>✨ Códigos Generados</Text>

            <View style={styles.codesListContainer}>
              <FlatList
                data={generatedCodes}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={true}
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.generatedCodeCard}
                    onPress={() => copyToClipboard(item)}
                  >
                    <Text style={styles.generatedCodeText}>{item}</Text>
                    <Text style={styles.copyIcon}>📋</Text>
                  </TouchableOpacity>
                )}
              />
            </View>

            <TouchableOpacity style={styles.copyAllButton} onPress={copyAllCodes}>
              <Text style={styles.copyAllButtonText}>📋 Copiar Todos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={() => setShowModal(false)}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    marginBottom: 16,
    letterSpacing: 1,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#C9A84C",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  tabTextActive: {
    color: "#000",
  },
  section: {
    marginBottom: 24,
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
  hint: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },
  input: {
    backgroundColor: "#0a0a0a",
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
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#C9A84C",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#C9A84C",
    marginBottom: 16,
    textAlign: "center",
  },
  codesListContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  generatedCodeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    padding: 12,
  },
  generatedCodeText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#C9A84C",
    letterSpacing: 1,
  },
  copyIcon: {
    fontSize: 16,
  },
  copyAllButton: {
    backgroundColor: "#C9A84C",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  copyAllButtonText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: "#333",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#C9A84C",
    fontWeight: "600",
    fontSize: 14,
  },
});
