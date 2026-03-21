import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useVIPProducts } from '@/hooks/use-vip-products';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import { useAuth } from '@/hooks/use-auth';

export default function VipProductsEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { products, createProduct, updateProduct, fetchProducts } = useVIPProducts();
  const { canEditProducts, canCreateProducts } = useAdminPermissions();
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadProduct(id);
      setIsEditing(true);
    }
  }, [id]);

  const loadProduct = (productId: string) => {
    const product = products.find(p => p.id === Number(productId));
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      setPrice(product.price.toString());
      setCategory(product.category || "");
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !description.trim() || !price.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'Usuario no autenticado');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && id) {
        await updateProduct(Number(id), {
          name,
          description,
          price: parseFloat(price),
          category,
        });
        Alert.alert('Éxito', 'Producto actualizado correctamente');
      } else {
        await createProduct(
          name,
          description,
          parseFloat(price),
          category
        );
        Alert.alert('Éxito', 'Producto creado correctamente');
      }
      router.back();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  if (!canEditProducts && !canCreateProducts) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No tienes permisos para editar productos</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{isEditing ? 'Editar Producto' : 'Crear Producto'}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre del Producto</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Champagne VIP"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#8A7A5A"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe el producto..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor="#8A7A5A"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Precio ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholderTextColor="#8A7A5A"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Categoría</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Bebidas"
            value={category}
            onChangeText={setCategory}
            placeholderTextColor="#8A7A5A"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomColor: '#2A2A2A',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#C9A84C',
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C9A84C',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderColor: '#2A2A2A',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: '#ECEDEE',
    fontSize: 14,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#C9A84C',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    borderColor: '#8A7A5A',
    borderWidth: 1,
  },
  cancelButtonText: {
    color: '#8A7A5A',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});
