import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useEvents } from '@/hooks/use-events';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import { useUserPersistence } from '@/hooks/use-user-persistence';
import { ScreenContainer } from '@/components/screen-container';

export default function EventsEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = params.id as string | undefined;
  
  const { user: adminUser } = useUserPersistence();
  const { events, createEvent, updateEvent } = useEvents();
  const { isAdmin } = useAdminPermissions();

  const [loading, setLoading] = useState(false);


  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    date: new Date(),
    startTime: '20:00',
    endTime: '23:00',
    price: '',
    maxGuests: '',
    details: '',
  });

  const existingEvent = eventId ? events.find(e => e.id === eventId) : null;

  useEffect(() => {
    if (existingEvent) {
      setForm({
        name: existingEvent.name,
        description: existingEvent.description,
        location: existingEvent.location,
        date: existingEvent.date,
        startTime: existingEvent.startTime,
        endTime: existingEvent.endTime,
        price: existingEvent.price.toString(),
        maxGuests: existingEvent.maxGuests.toString(),
        details: existingEvent.details || '',
      });
    }
  }, [existingEvent]);



  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'El nombre del evento es requerido');
      return;
    }
    if (!form.description.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }
    if (!form.location.trim()) {
      Alert.alert('Error', 'La ubicación es requerida');
      return;
    }
    if (!form.price || isNaN(Number(form.price))) {
      Alert.alert('Error', 'El precio debe ser un número válido');
      return;
    }
    if (!form.maxGuests || isNaN(Number(form.maxGuests))) {
      Alert.alert('Error', 'El máximo de invitados debe ser un número válido');
      return;
    }

    setLoading(true);
    try {
      if (eventId && existingEvent) {
        await updateEvent(eventId, {
          name: form.name,
          description: form.description,
          location: form.location,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          price: Number(form.price),
          maxGuests: Number(form.maxGuests),
          details: form.details,
        });
        Alert.alert('Éxito', 'Evento actualizado correctamente');
      } else {
        await createEvent(
          form.name,
          form.description,
          form.location,
          form.date,
          form.startTime,
          form.endTime,
          Number(form.price),
          Number(form.maxGuests),
          adminUser?.id || 'admin',
          form.details
        );
        Alert.alert('Éxito', 'Evento creado correctamente');
      }
      router.back();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el evento');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No tienes permisos para acceder a esta sección</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Atrás</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {eventId ? 'Editar Evento' : 'Crear Evento'}
          </Text>
        </View>

        {/* Nombre */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nombre del Evento *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Fiesta VIP de Verano"
            placeholderTextColor="#666"
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
          />
        </View>

        {/* Descripción */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Descripción *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe el evento..."
            placeholderTextColor="#666"
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Ubicación */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>📍 Ubicación *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Av. Reforma 123, CDMX"
            placeholderTextColor="#666"
            value={form.location}
            onChangeText={(v) => setForm({ ...form, location: v })}
          />
        </View>

        {/* Fecha */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>📅 Fecha del Evento *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#666"
            value={form.date.toISOString().split('T')[0]}
            onChangeText={(v) => {
              const newDate = new Date(v);
              if (!isNaN(newDate.getTime())) {
                setForm({ ...form, date: newDate });
              }
            }}
          />
        </View>

        {/* Hora de Inicio */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>🕐 Hora de Inicio *</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM"
            placeholderTextColor="#666"
            value={form.startTime}
            onChangeText={(v) => setForm({ ...form, startTime: v })}
          />
        </View>

        {/* Hora de Fin */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>🕐 Hora de Fin *</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM"
            placeholderTextColor="#666"
            value={form.endTime}
            onChangeText={(v) => setForm({ ...form, endTime: v })}
          />
        </View>

        {/* Precio */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>💰 Precio (MXN) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 500"
            placeholderTextColor="#666"
            value={form.price}
            onChangeText={(v) => setForm({ ...form, price: v })}
            keyboardType="numeric"
          />
        </View>

        {/* Máximo de Invitados */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>👥 Máximo de Invitados *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 40"
            placeholderTextColor="#666"
            value={form.maxGuests}
            onChangeText={(v) => setForm({ ...form, maxGuests: v })}
            keyboardType="numeric"
          />
        </View>

        {/* Detalles Adicionales */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>📝 Detalles Adicionales</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Información adicional del evento..."
            placeholderTextColor="#666"
            value={form.details}
            onChangeText={(v) => setForm({ ...form, details: v })}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Botones de Acción */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0A" />
            ) : (
              <Text style={styles.submitButtonText}>
                {eventId ? 'Actualizar' : 'Crear'} Evento
              </Text>
            )}
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    color: '#C9A84C',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#C9A84C',
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ECEDEE',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderColor: '#2A2A2A',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ECEDEE',
    fontSize: 14,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: '#1A1A1A',
    borderColor: '#2A2A2A',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  dateButtonText: {
    color: '#ECEDEE',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ECEDEE',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#C9A84C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#0A0A0A',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
  },
});
