import { useCallback, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  date: Date;
  startTime: string;
  endTime: string;
  price: number;
  maxGuests: number;
  currentGuests: number;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  isActive: boolean;
  imageUrl?: string;
  details?: string;
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener todos los eventos
  const fetchEvents = useCallback(async (activeOnly = false) => {
    setLoading(true);
    setError(null);
    try {
      let q;
      if (activeOnly) {
        q = query(
          collection(db, 'events'),
          where('isActive', '==', true),
          orderBy('date', 'desc')
        );
      } else {
        q = query(
          collection(db, 'events'),
          orderBy('date', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.() || new Date(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || undefined,
      } as Event));
      setEvents(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener eventos';
      setError(message);
      console.error('[useEvents] Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear evento
  const createEvent = useCallback(
    async (
      name: string,
      description: string,
      location: string,
      date: Date,
      startTime: string,
      endTime: string,
      price: number,
      maxGuests: number,
      adminId: string,
      details?: string,
      imageUrl?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const event = {
          name,
          description,
          location,
          date: Timestamp.fromDate(date),
          startTime,
          endTime,
          price,
          maxGuests,
          currentGuests: 0,
          createdBy: adminId,
          createdAt: Timestamp.now(),
          isActive: true,
          ...(details && { details }),
          ...(imageUrl && { imageUrl }),
        };

        const docRef = await addDoc(collection(db, 'events'), event);
        await fetchEvents();
        return docRef.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al crear evento';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchEvents]
  );

  // Editar evento
  const updateEvent = useCallback(
    async (
      eventId: string,
      updates: Partial<Omit<Event, 'id' | 'createdBy' | 'createdAt' | 'currentGuests'>>
    ) => {
      setLoading(true);
      setError(null);
      try {
        const eventRef = doc(db, 'events', eventId);
        const updateData: any = { ...updates };
        
        // Convertir date a Timestamp si existe
        if (updates.date instanceof Date) {
          updateData.date = Timestamp.fromDate(updates.date);
        }
        
        updateData.updatedAt = Timestamp.now();

        await updateDoc(eventRef, updateData);
        await fetchEvents();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al actualizar evento';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchEvents]
  );

  // Eliminar evento (soft delete)
  const deleteEvent = useCallback(
    async (eventId: string) => {
      setLoading(true);
      setError(null);
      try {
        const eventRef = doc(db, 'events', eventId);
        await updateDoc(eventRef, { 
          isActive: false,
          updatedAt: Timestamp.now(),
        });
        await fetchEvents();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al eliminar evento';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchEvents]
  );

  // Incrementar contador de invitados
  const incrementGuests = useCallback(async (eventId: string) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const event = events.find(e => e.id === eventId);
      if (event) {
        await updateDoc(eventRef, {
          currentGuests: event.currentGuests + 1,
          updatedAt: Timestamp.now(),
        });
        await fetchEvents();
      }
    } catch (err) {
      console.error('[useEvents] Error incrementing guests:', err);
      throw err;
    }
  }, [events, fetchEvents]);

  // Decrementar contador de invitados
  const decrementGuests = useCallback(async (eventId: string) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const event = events.find(e => e.id === eventId);
      if (event && event.currentGuests > 0) {
        await updateDoc(eventRef, {
          currentGuests: event.currentGuests - 1,
          updatedAt: Timestamp.now(),
        });
        await fetchEvents();
      }
    } catch (err) {
      console.error('[useEvents] Error decrementing guests:', err);
      throw err;
    }
  }, [events, fetchEvents]);

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    incrementGuests,
    decrementGuests,
  };
}
