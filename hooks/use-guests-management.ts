import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  query,
  getDocs,
  updateDoc,
  doc,
  where,
  onSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Guest {
  id: string;
  name: string;
  email?: string;
  code: string;
  paymentStatus: 'pending' | 'verified' | 'rejected';
  paymentProof?: string; // URL de la foto de comprobante
  eventId?: string;
  createdAt: string;
  lastUpdated: string;
  notes?: string;
}

export function useGuestsManagement() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar lista de invitados
  const loadGuests = useCallback(async (eventId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const constraints: QueryConstraint[] = [];
      if (eventId) {
        constraints.push(where('eventId', '==', eventId));
      }

      const q = query(collection(db, 'guests'), ...constraints);
      const snapshot = await getDocs(q);

      const guestsList: Guest[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Guest));

      setGuests(guestsList);
      return guestsList;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading guests';
      setError(message);
      console.error('Error loading guests:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Suscribirse a cambios en tiempo real
  const subscribeToGuests = useCallback((eventId?: string, onUpdate?: (guests: Guest[]) => void) => {
    try {
      const constraints: QueryConstraint[] = [];
      if (eventId) {
        constraints.push(where('eventId', '==', eventId));
      }

      const q = query(collection(db, 'guests'), ...constraints);

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const guestsList: Guest[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Guest));

        setGuests(guestsList);
        onUpdate?.(guestsList);
      });

      return unsubscribe;
    } catch (err) {
      console.error('Error subscribing to guests:', err);
      return () => {};
    }
  }, []);

  // Marcar pago como verificado
  const verifyPayment = useCallback(async (guestId: string, notes?: string) => {
    try {
      const guestRef = doc(db, 'guests', guestId);
      await updateDoc(guestRef, {
        paymentStatus: 'verified',
        lastUpdated: new Date().toISOString(),
        notes: notes || '',
      });

      // Actualizar estado local
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guestId
            ? { ...g, paymentStatus: 'verified', lastUpdated: new Date().toISOString(), notes }
            : g
        )
      );

      return true;
    } catch (err) {
      console.error('Error verifying payment:', err);
      throw err;
    }
  }, []);

  // Rechazar pago
  const rejectPayment = useCallback(async (guestId: string, reason?: string) => {
    try {
      const guestRef = doc(db, 'guests', guestId);
      await updateDoc(guestRef, {
        paymentStatus: 'rejected',
        lastUpdated: new Date().toISOString(),
        notes: reason || 'Pago rechazado',
      });

      // Actualizar estado local
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guestId
            ? { ...g, paymentStatus: 'rejected', lastUpdated: new Date().toISOString() }
            : g
        )
      );

      return true;
    } catch (err) {
      console.error('Error rejecting payment:', err);
      throw err;
    }
  }, []);

  // Resetear estado de pago a pendiente
  const resetPaymentStatus = useCallback(async (guestId: string) => {
    try {
      const guestRef = doc(db, 'guests', guestId);
      await updateDoc(guestRef, {
        paymentStatus: 'pending',
        lastUpdated: new Date().toISOString(),
      });

      // Actualizar estado local
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guestId
            ? { ...g, paymentStatus: 'pending', lastUpdated: new Date().toISOString() }
            : g
        )
      );

      return true;
    } catch (err) {
      console.error('Error resetting payment status:', err);
      throw err;
    }
  }, []);

  // Agregar notas al invitado
  const addNotes = useCallback(async (guestId: string, notes: string) => {
    try {
      const guestRef = doc(db, 'guests', guestId);
      await updateDoc(guestRef, {
        notes,
        lastUpdated: new Date().toISOString(),
      });

      // Actualizar estado local
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guestId
            ? { ...g, notes, lastUpdated: new Date().toISOString() }
            : g
        )
      );

      return true;
    } catch (err) {
      console.error('Error adding notes:', err);
      throw err;
    }
  }, []);

  // Obtener estadísticas de pagos
  const getPaymentStats = useCallback(() => {
    const total = guests.length;
    const verified = guests.filter((g) => g.paymentStatus === 'verified').length;
    const pending = guests.filter((g) => g.paymentStatus === 'pending').length;
    const rejected = guests.filter((g) => g.paymentStatus === 'rejected').length;

    return {
      total,
      verified,
      pending,
      rejected,
      verificationRate: total > 0 ? Math.round((verified / total) * 100) : 0,
    };
  }, [guests]);

  return {
    guests,
    loading,
    error,
    loadGuests,
    subscribeToGuests,
    verifyPayment,
    rejectPayment,
    resetPaymentStatus,
    addNotes,
    getPaymentStats,
  };
}
