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
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useVIPProducts } from "@/hooks/use-vip-products";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { HamburgerButton } from "@/components/hamburger-button";
import { AdminSidebar } from "@/components/admin-sidebar";
import * as Haptics from "expo-haptics";

export default function VIPProductsScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useVIPProducts();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async () => {
    if (!name.trim() || !description.trim() || !price.trim()) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "Usuario no identificado");
      return;
    }

    setCreating(true);
    try {
      await createProduct(
        name,
        description,
        parseFloat(price),
        category || "General"
      );
      setName("");
      setDescription("");
      setPrice("");
      setCategory("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Éxito", "Producto creado correctamente");
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", err instanceof Error ? err.message : "Error al crear");
    } finally {
      setCreating(false);
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setCategory(product.category);
  };

  const handleUpdateProduct = async () => {
    if (!editingId) return;

    if (!name.trim() || !description.trim() || !price.trim()) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    setCreating(true);
    try {
      await updateProduct(Number(editingId), {
        name,
        description,
        price: parseFloat(price),
        category,
      });
      setName("");
      setDescription("");
      setPrice("");
      setCategory("");
      setEditingId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Éxito", "Producto actualizado correctamente");
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    Alert.alert(
      "Eliminar producto",
      `¿Estás seguro de que deseas eliminar "${productName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProduct(Number(productId));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err) {
              Alert.alert("Error", "No se pudo eliminar el producto");
            }
          },
        },
      ]
    );
  };

  const renderProductItem = ({ item }: { item: any }) => (
    <View style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.productHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.productName, { color: colors.foreground }]}>{item.name}</Text>
          <Text style={[styles.productCategory, { color: colors.muted }]}>{item.category}</Text>
        </View>
        <Text style={[styles.productPrice, { color: colors.primary }]}>${item.price}</Text>
      </View>

      <Text style={[styles.productDescription, { color: colors.muted }]}>{item.description}</Text>

      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: `${colors.primary}20` }]}
          onPress={() => handleEditProduct(item)}
        >
          <Text style={styles.actionBtnText}>✏️ Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnDanger]}
          onPress={() => handleDeleteProduct(item.id, item.name)}
        >
          <Text style={styles.actionBtnText}>🗑️ Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header con botón hamburguesa */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <HamburgerButton onPress={() => setSidebarOpen(true)} />
        <Text style={[styles.headerTitle, { color: colors.primary }]}>
          ⭐ Productos VIP
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Formulario */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {editingId ? "Editar Producto" : "Crear Nuevo Producto"}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.primary }]}>Nombre</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Ej: Botella de Champagne"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              editable={!creating}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.primary }]}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Describe el producto..."
              placeholderTextColor={colors.muted}
              value={description}
              onChangeText={setDescription}
              editable={!creating}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: colors.primary }]}>Precio</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                value={price}
                onChangeText={setPrice}
                editable={!creating}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.primary }]}>Categoría</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                placeholder="General"
                placeholderTextColor={colors.muted}
                value={category}
                onChangeText={setCategory}
                editable={!creating}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }, creating && styles.submitBtnDisabled]}
            onPress={editingId ? handleUpdateProduct : handleCreateProduct}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitBtnText}>
                {editingId ? "💾 Actualizar" : "+ Crear Producto"}
              </Text>
            )}
          </TouchableOpacity>

          {editingId && (
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                setEditingId(null);
                setName("");
                setDescription("");
                setPrice("");
                setCategory("");
              }}
            >
              <Text style={[styles.cancelBtnText, { color: colors.muted }]}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de productos */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Productos Activos ({products.length})
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} size="large" />
          ) : error ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          ) : products.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>No hay productos creados</Text>
          ) : (
            <FlatList
              data={products}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id.toString()}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: {
    paddingVertical: 12,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  submitBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
  },
  cancelBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    fontWeight: "600",
    fontSize: 14,
  },
  productCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
  },
  productCategory: {
    fontSize: 12,
    marginTop: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "800",
  },
  productDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  productActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionBtnDanger: {
    backgroundColor: "#EF444420",
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C9A84C",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 32,
  },
});
