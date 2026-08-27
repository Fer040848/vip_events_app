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

const DEFAULT_PAYMENT_LINK = 'https://mpago.la/1Tz6Riv';

export default function PaymentLinksScreen() {
  const colors = useColors();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [newUrl, setNewUrl] = useState('');

  const { data: events } = trpc.events.listAll.useQuery();
  const { data: linkHistory = [], refetch: refetchHistory } = trpc.payments.getHistory.useQuery(
    { eventId: selectedEventId ?? 0 },
    { enabled: selectedEventId !== null }
  );
  const { data: clicks = [], refetch: refetchClicks } = trpc.payments.getClicks.useQuery(
    { eventId: selectedEventId ?? 0 },
    { enabled: selectedEventId !== null }
  );
  const updateLinkMutation = trpc.payments.updateLink.useMutation({
    onSuccess: () => {
      Alert.alert('✓ Éxito', 'Link de pago actualizado correctamente');
      setNewUrl('');
      refetchHistory();
      refetchClicks();
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
                onPress={() => {
                  setSelectedEventId(event.id);
                  setNewUrl(event.mercadoPagoLink ?? DEFAULT_PAYMENT_LINK);
                }}
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
            placeholder={DEFAULT_PAYMENT_LINK}
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

        {selectedEventId !== null && (
          <>
            <View style={styles.auditSection}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Historial de enlaces</Text>
              {linkHistory.length === 0 ? (
                <Text style={[styles.emptyAuditText, { color: colors.muted }]}>Aún no hay cambios registrados para este evento.</Text>
              ) : (
                linkHistory.map((link) => (
                  <View key={link.id} style={[styles.auditRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                    <View style={styles.auditTextGroup}>
                      <Text style={[styles.auditLabel, { color: link.isActive ? colors.primary : colors.foreground }]}>
                        {link.isActive ? 'ACTIVO' : 'Histórico'}
                      </Text>
                      <Text style={[styles.auditUrl, { color: colors.muted }]} numberOfLines={1}>{link.url}</Text>
                    </View>
                    <Text style={[styles.auditDate, { color: colors.muted }]}>
                      {new Date(link.updatedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.auditSection}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Aperturas del enlace ({clicks.length})</Text>
              {clicks.length === 0 ? (
                <Text style={[styles.emptyAuditText, { color: colors.muted }]}>Todavía no hay aperturas registradas.</Text>
              ) : (
                clicks.slice(0, 8).map((click) => (
                  <View key={click.id} style={[styles.auditRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                    <View style={styles.auditTextGroup}>
                      <Text style={[styles.clickUser, { color: colors.foreground }]}>
                        {click.userName ?? click.userCode?.replace('code_', '') ?? `Usuario #${click.userId}`}
                      </Text>
                      <Text style={[styles.auditDate, { color: colors.muted }]}>
                        {new Date(click.clickedAt).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={[styles.clickLabel, { color: colors.primary }]}>Abrió</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}

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
  auditSection: {
    marginBottom: 24,
  },
  emptyAuditText: {
    fontSize: 13,
    lineHeight: 19,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
    gap: 10,
  },
  auditTextGroup: {
    flex: 1,
    gap: 3,
  },
  auditLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  auditUrl: {
    fontSize: 12,
  },
  auditDate: {
    fontSize: 11,
  },
  clickUser: {
    fontSize: 13,
    fontWeight: '600',
  },
  clickLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
});
