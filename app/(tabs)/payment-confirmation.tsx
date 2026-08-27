import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { trpc } from '@/lib/trpc';

export default function PaymentConfirmationScreen() {
  const colors = useColors();
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [selectedImage, setSelectedImage] = useState<{ uri: string; mimeType: 'image/jpeg' | 'image/png' } | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: event } = trpc.events.get.useQuery(
    { id: Number(eventId) },
    { enabled: !!eventId }
  );

  const submitConfirmationMutation = trpc.payments.submitConfirmation.useMutation({
    onSuccess: () => {
      Alert.alert(
        '✓ Comprobante enviado',
        'Tu comprobante de pago ha sido enviado. Los administradores lo revisarán pronto.',
        [{ text: 'Entendido', onPress: () => router.back() }]
      );
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.65,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setSelectedImage({
          uri: asset.uri,
          mimeType: asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg',
        });
      }
    } catch {
      Alert.alert('Error', 'No se pudo acceder a la galería');
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Selecciona una imagen del comprobante');
      return;
    }

    if (!eventId) {
      Alert.alert('Error', 'Evento no encontrado');
      return;
    }

    setUploading(true);
    try {
      const imageBase64 = await FileSystem.readAsStringAsync(selectedImage.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await submitConfirmationMutation.mutateAsync({
        eventId: Number(eventId),
        imageBase64,
        mimeType: selectedImage.mimeType,
      });
    } catch {
      Alert.alert('Error', 'No se pudo subir el comprobante. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>
            ← Volver
          </Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            💳 Confirmar Pago
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {event?.title}
          </Text>
        </View>

        {/* Instructions */}
        <View
          style={[
            styles.instructionsBox,
            { backgroundColor: `${colors.primary}15`, borderColor: colors.primary },
          ]}
        >
          <Text style={[styles.instructionsTitle, { color: colors.primary }]}>
            📸 Instrucciones
          </Text>
          <Text style={[styles.instructionText, { color: colors.foreground }]}>
            1. Conserva el comprobante emitido por tu banco o Mercado Pago
          </Text>
          <Text style={[styles.instructionText, { color: colors.foreground }]}>
            2. Selecciona la imagen desde tu galería
          </Text>
          <Text style={[styles.instructionText, { color: colors.foreground }]}>
            3. Envía el comprobante para revisión
          </Text>
          <Text style={[styles.instructionText, { color: colors.muted, marginTop: 8 }]}>
            ⚠️ Solo los administradores pueden ver tu comprobante
          </Text>
        </View>

        {/* Image Preview */}
        {selectedImage && (
          <View style={styles.previewSection}>
            <Text style={[styles.previewTitle, { color: colors.foreground }]}>
              Comprobante seleccionado
            </Text>
            <Image
              source={{ uri: selectedImage.uri }}
              style={[
                styles.previewImage,
                { borderColor: colors.border },
              ]}
            />
            <TouchableOpacity
              style={[
                styles.changeImageBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={pickImage}
            >
              <Text style={[styles.changeImageBtnText, { color: colors.foreground }]}>
                Cambiar imagen
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Select Image Button */}
        {!selectedImage && (
          <TouchableOpacity
            style={[
              styles.selectBtn,
              { backgroundColor: colors.surface, borderColor: colors.primary },
            ]}
            onPress={pickImage}
          >
            <Text style={[styles.selectBtnIcon]}>📁</Text>
            <Text style={[styles.selectBtnText, { color: colors.foreground }]}>
              Seleccionar comprobante
            </Text>
          </TouchableOpacity>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor: colors.primary,
              opacity: uploading || !selectedImage ? 0.6 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={uploading || !selectedImage}
        >
          {uploading || submitConfirmationMutation.isPending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitBtnText}>Enviar comprobante</Text>
          )}
        </TouchableOpacity>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Text style={[styles.securityIcon]}>🔒</Text>
          <Text style={[styles.securityText, { color: colors.muted }]}>
            Tu comprobante está protegido y solo será visto por administradores autorizados.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  backBtn: {
    marginBottom: 16,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  instructionsBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  previewSection: {
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  changeImageBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  changeImageBtnText: {
    fontWeight: '500',
    fontSize: 14,
  },
  selectBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  selectBtnIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  selectBtnText: {
    fontWeight: '600',
    fontSize: 16,
  },
  submitBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitBtnText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  securityIcon: {
    fontSize: 16,
  },
  securityText: {
    fontSize: 12,
    flex: 1,
  },
});
