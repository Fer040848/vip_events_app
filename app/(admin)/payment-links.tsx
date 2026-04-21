import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { trpc } from '@/lib/trpc';

export default function PaymentLinksScreen() {
  const colors = useColors();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [newUrl, setNewUrl] = useState('');

  const { data: events } = trpc.events.listAll.useQuery();
  const updateLinkMutation = trpc.payments.updateLink.useMutation({
    onSuccess: () => {
      Alert.alert('✓ Éxito', 'Link de pago actualizado correctamente');
      setNewUrl('');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleUpdateLink = () => {
    if (!selectedEventId || !newUrl) {
      Alert.alert('Error', 'Selecciona un evento e ingresa una URL válida');
      return;
    }

    updateLinkMutation.mutate({
      eventId: selectedEventId,
      url: newUrl,
    });
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            💳 Gestionar Links de Pago
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Actualiza los links de Mercado Pago para cada evento
          </Text>
        </View>

        {/* Event Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Selecciona un evento
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.eventsList}
          >
            {events?.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.eventCard,
                  {
                    backgroundColor:
                      selectedEventId === event.id
                        ? colors.primary
                        : colors.surface,
                    borderColor:
                      selectedEventId === event.id
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => setSelectedEventId(event.id)}
              >
                <Text
                  style={[
                    styles.eventCardText,
                    {
                      color:
                        selectedEventId === event.id
                          ? '#000'
                          : colors.foreground,
                    },
                  ]}
                >
                  {event.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* URL Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Nuevo Link de Pago
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="https://mpago.la/..."
            placeholderTextColor={colors.muted}
            value={newUrl}
            onChangeText={setNewUrl}
            editable={!updateLinkMutation.isPending}
          />
          <Text style={[styles.hint, { color: colors.muted }]}>
            Ingresa la URL completa del link de Mercado Pago
          </Text>
        </View>

        {/* Update Button */}
        <TouchableOpacity
          style={[
            styles.updateBtn,
            {
              backgroundColor: colors.primary,
              opacity: updateLinkMutation.isPending ? 0.6 : 1,
            },
          ]}
          onPress={handleUpdateLink}
          disabled={updateLinkMutation.isPending}
        >
          {updateLinkMutation.isPending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.updateBtnText}>Actualizar Link</Text>
          )}
        </TouchableOpacity>

        {/* Info Section */}
        <View
          style={[
            styles.infoBox,
            { backgroundColor: `${colors.primary}15`, borderColor: colors.primary },
          ]}
        >
          <Text style={[styles.infoTitle, { color: colors.primary }]}>
            ℹ️ Información
          </Text>
          <Text style={[styles.infoText, { color: colors.foreground }]}>
            • Todos los usuarios verán el nuevo link
          </Text>
          <Text style={[styles.infoText, { color: colors.foreground }]}>
            • Se registra quién clickeó cada link
          </Text>
          <Text style={[styles.infoText, { color: colors.foreground }]}>
            • Los usuarios pueden confirmar pago con screenshot
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  eventsList: {
    marginBottom: 12,
  },
  eventCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  eventCardText: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
  },
  updateBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  updateBtnText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    marginBottom: 4,
  },
});
