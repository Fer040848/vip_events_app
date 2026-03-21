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
import * as Haptics from "expo-haptics";

export default function VIPProductsScreen() {
  const { user } = useAuth();
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
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productCategory}>{item.category}</Text>
        </View>
        <Text style={styles.productPrice}>${item.price}</Text>
      </View>

      <Text style={styles.productDescription}>{item.description}</Text>

      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.actionBtn}
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
    <ScreenContainer className="bg-black">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Gestión de Productos VIP</Text>

        {/* Formulario */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {editingId ? "Editar Producto" : "Crear Nuevo Producto"}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Botella de Champagne"
              placeholderTextColor="#555"
              value={name}
              onChangeText={setName}
              editable={!creating}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe el producto..."
              placeholderTextColor="#555"
              value={description}
              onChangeText={setDescription}
              editable={!creating}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Precio</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#555"
                value={price}
                onChangeText={setPrice}
                editable={!creating}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Categoría</Text>
              <TextInput
                style={styles.input}
                placeholder="General"
                placeholderTextColor="#555"
                value={category}
                onChangeText={setCategory}
                editable={!creating}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, creating && styles.submitBtnDisabled]}
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
              style={styles.cancelBtn}
              onPress={() => {
                setEditingId(null);
                setName("");
                setDescription("");
                setPrice("");
                setCategory("");
              }}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de productos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Productos Activos ({products.length})
          </Text>

          {loading ? (
            <ActivityIndicator color="#C9A84C" size="large" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : products.length === 0 ? (
            <Text style={styles.emptyText}>No hay productos creados</Text>
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
    fontSize: 14,
    color: "#fff",
  },
  textArea: {
    paddingVertical: 12,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  submitBtn: {
    backgroundColor: "#C9A84C",
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
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#888",
    fontWeight: "600",
    fontSize: 14,
  },
  productCard: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
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
    color: "#fff",
  },
  productCategory: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#C9A84C",
  },
  productDescription: {
    fontSize: 13,
    color: "#ccc",
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
