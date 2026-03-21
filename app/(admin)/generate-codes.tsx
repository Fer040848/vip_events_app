import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAccessCodes } from '@/hooks/use-access-codes';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

export default function GenerateCodesScreen() {
  const { createCode, fetchAllCodes, codes, loading, error } = useAccessCodes();
  const [codePrefix, setCodePrefix] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  useEffect(() => {
    fetchAllCodes();
  }, [fetchAllCodes]);

  const generateCodes = async () => {
    if (!codePrefix.trim()) {
      Alert.alert('Error', 'Por favor ingresa un prefijo para los códigos');
      return;
    }

    const qty = parseInt(quantity) || 1;
    if (qty < 1 || qty > 100) {
      Alert.alert('Error', 'La cantidad debe estar entre 1 y 100');
      return;
    }

    setIsGenerating(true);
    const newCodes: string[] = [];

    try {
      for (let i = 1; i <= qty; i++) {
        const code = `${codePrefix.toUpperCase()}${String(i).padStart(3, '0')}`;
        await createCode(code, isAdmin ? 'admin' : 'user', 'admin-user');
        newCodes.push(code);
      }

      setGeneratedCodes(newCodes);
      setShowModal(true);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Reset form
      setCodePrefix('');
      setQuantity('1');
      setIsAdmin(false);

      // Reload codes
      await fetchAllCodes();
    } catch (err) {
      Alert.alert('Error', 'No se pudieron generar los códigos');
      console.error('Error generating codes:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('✅ Copiado', 'Código copiado al portapapeles');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo copiar el código');
    }
  };

  const copyAllCodes = async () => {
    try {
      const codesText = generatedCodes.join('\n');
      await Clipboard.setStringAsync(codesText);
      Alert.alert('✅ Copiados', 'Todos los códigos fueron copiados');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron copiar los códigos');
    }
  };

  const adminCodes = codes.filter((c) => c.role === 'admin');
  const userCodes = codes.filter((c) => c.role === 'user');

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-4 pt-6 pb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">Generar Códigos</Text>
          <Text className="text-sm text-muted">Crea códigos de acceso personalizados</Text>
        </View>

        {/* Generation Form */}
        <View className="px-4 mb-6">
          <View style={styles.formCard}>
            {/* Prefix Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Prefijo del Código</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: TLC, VIP, GOLD"
                placeholderTextColor="#666"
                value={codePrefix}
                onChangeText={setCodePrefix}
                maxLength={10}
              />
              <Text style={styles.hint}>Se generarán códigos como: TLC001, TLC002, etc.</Text>
            </View>

            {/* Quantity Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Cantidad de Códigos</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#666"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={styles.hint}>Máximo 100 códigos por lote</Text>
            </View>

            {/* Type Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tipo de Código</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[styles.typeButton, !isAdmin && styles.typeButtonActive]}
                  onPress={() => setIsAdmin(false)}
                >
                  <Text style={[styles.typeButtonText, !isAdmin && styles.typeButtonTextActive]}>
                    👤 Usuario
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, isAdmin && styles.typeButtonActive]}
                  onPress={() => setIsAdmin(true)}
                >
                  <Text style={[styles.typeButtonText, isAdmin && styles.typeButtonTextActive]}>
                    👑 Administrador
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateCodes}
              disabled={isGenerating}
            >
              <Text style={styles.generateButtonText}>
                {isGenerating ? 'Generando...' : '✨ Generar Códigos'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics */}
        <View className="px-4 mb-6">
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={styles.statValue}>{codes.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Admin</Text>
              <Text style={[styles.statValue, { color: '#C9A84C' }]}>{adminCodes.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Usuario</Text>
              <Text style={[styles.statValue, { color: '#8A7A5A' }]}>{userCodes.length}</Text>
            </View>
          </View>
        </View>

        {/* Codes List */}
        <View className="px-4">
          <Text className="text-lg font-bold text-foreground mb-3">Códigos Generados</Text>

          {codes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>Sin códigos</Text>
              <Text style={styles.emptySubtitle}>Genera tu primer código arriba</Text>
            </View>
          ) : (
            <FlatList
              data={codes}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.codeCard}
                  onPress={() => copyToClipboard(item.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.codeContent}>
                    <Text style={styles.codeText}>{item.code}</Text>
                    <Text style={styles.codeType}>{item.role === 'admin' ? '👑' : '👤'}</Text>
                  </View>
                  <Text style={styles.copyHint}>Toca para copiar</Text>
                </TouchableOpacity>
              )}
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
  formCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F5E6C8',
  },
  input: {
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#F5E6C8',
  },
  hint: {
    fontSize: 11,
    color: '#8A7A5A',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#C9A84C22',
    borderColor: '#C9A84C',
  },
  typeButtonText: {
    fontSize: 13,
    color: '#8A7A5A',
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#C9A84C',
    fontWeight: '700',
  },
  generateButton: {
    backgroundColor: '#C9A84C',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  generateButtonText: {
    color: '#0A0A0A',
    fontSize: 15,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#8A7A5A',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F5E6C8',
  },
  emptyState: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5E6C8',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#8A7A5A',
  },
  codeCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C9A84C',
    fontFamily: 'monospace',
  },
  codeType: {
    fontSize: 16,
  },
  copyHint: {
    fontSize: 10,
    color: '#8A7A5A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: '#2a2200',
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F5E6C8',
    marginBottom: 16,
  },
  codesListContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  generatedCodeCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  generatedCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C9A84C',
    fontFamily: 'monospace',
  },
  copyIcon: {
    fontSize: 16,
  },
  copyAllButton: {
    backgroundColor: '#C9A84C22',
    borderWidth: 1,
    borderColor: '#C9A84C44',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  copyAllButtonText: {
    color: '#C9A84C',
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#8A7A5A',
    fontSize: 14,
    fontWeight: '600',
  },
});
