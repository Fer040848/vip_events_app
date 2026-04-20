import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type RsvpStatus = 'going' | 'maybe' | 'not_going' | null;

export interface Rsvp {
  userId: number;
  eventId: number;
  status: RsvpStatus;
  respondedAt: Date;
}

const RSVPS_STORAGE_KEY = '@vip_events_rsvps';

/**
 * Hook para manejar RSVPs de eventos
 * Usa AsyncStorage para persistencia local
 */
export function useRsvps(eventId: number, userId: number) {
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpCounts, setRsvpCounts] = useState({ going: 0, maybe: 0, not_going: 0 });

  // Cargar RSVP del usuario para este evento
  useEffect(() => {
    loadRsvpStatus();
    loadRsvpCounts();
  }, [eventId, userId]);

  const loadRsvpStatus = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(RSVPS_STORAGE_KEY);
      if (stored) {
        const rsvps: Rsvp[] = JSON.parse(stored);
        const userRsvp = rsvps.find((r) => r.eventId === eventId && r.userId === userId);
        setRsvpStatus(userRsvp?.status || null);
      }
    } catch (error) {
      console.error('Error loading RSVP status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRsvpCounts = async () => {
    try {
      const stored = await AsyncStorage.getItem(RSVPS_STORAGE_KEY);
      if (stored) {
        const rsvps: Rsvp[] = JSON.parse(stored);
        const eventRsvps = rsvps.filter((r) => r.eventId === eventId);
        setRsvpCounts({
          going: eventRsvps.filter((r) => r.status === 'going').length,
          maybe: eventRsvps.filter((r) => r.status === 'maybe').length,
          not_going: eventRsvps.filter((r) => r.status === 'not_going').length,
        });
      }
    } catch (error) {
      console.error('Error loading RSVP counts:', error);
    }
  };

  const respondToRsvp = async (status: RsvpStatus) => {
    try {
      const stored = await AsyncStorage.getItem(RSVPS_STORAGE_KEY);
      let rsvps: Rsvp[] = stored ? JSON.parse(stored) : [];

      // Encontrar y actualizar o crear nuevo RSVP
      const existingIndex = rsvps.findIndex((r) => r.eventId === eventId && r.userId === userId);
      const newRsvp: Rsvp = {
        userId,
        eventId,
        status,
        respondedAt: new Date(),
      };

      if (existingIndex >= 0) {
        rsvps[existingIndex] = newRsvp;
      } else {
        rsvps.push(newRsvp);
      }

      await AsyncStorage.setItem(RSVPS_STORAGE_KEY, JSON.stringify(rsvps));
      setRsvpStatus(status);
      await loadRsvpCounts();
    } catch (error) {
      console.error('Error saving RSVP:', error);
      throw error;
    }
  };

  const getEventRsvps = async (): Promise<Rsvp[]> => {
    try {
      const stored = await AsyncStorage.getItem(RSVPS_STORAGE_KEY);
      if (stored) {
        const rsvps: Rsvp[] = JSON.parse(stored);
        return rsvps.filter((r) => r.eventId === eventId);
      }
      return [];
    } catch (error) {
      console.error('Error getting event RSVPs:', error);
      return [];
    }
  };

  return {
    rsvpStatus,
    loading,
    rsvpCounts,
    respondToRsvp,
    getEventRsvps,
    reload: () => {
      loadRsvpStatus();
      loadRsvpCounts();
    },
  };
}
