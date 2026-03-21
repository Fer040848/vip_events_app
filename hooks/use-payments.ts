import { useCallback, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface Payment {
  id: string;
  userId: string;
  eventId: string;
  amount: number;
  status: "pending" | "paid" | "verified";
  proofUrl?: string;
  createdAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  notes?: string;
}

export interface PaymentLink {
  id: string;
  url: string;
  createdBy: string;
  createdAt: Date;
  eventId?: string;
}

export function usePayments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener link de pago actual
  const getPaymentLink = useCallback(async (eventId?: string) => {
    try {
      let q;
      if (eventId) {
        q = query(
          collection(db, "payment_links"),
          where("eventId", "==", eventId)
        );
      } else {
        q = query(collection(db, "payment_links"));
      }

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      } as PaymentLink;
    } catch (err) {
      throw err;
    }
  }, []);

  // Crear/actualizar link de pago (solo admin)
  const setPaymentLink = useCallback(
    async (url: string, adminId: string, eventId?: string) => {
      setLoading(true);
      setError(null);
      try {
        // Obtener link existente
        let q;
        if (eventId) {
          q = query(
            collection(db, "payment_links"),
            where("eventId", "==", eventId)
          );
        } else {
          q = query(collection(db, "payment_links"));
        }

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          // Actualizar existente
          const docRef = doc(db, "payment_links", snapshot.docs[0].id);
          await updateDoc(docRef, {
            url,
            createdAt: Timestamp.now(),
          });
          return snapshot.docs[0].id;
        } else {
          // Crear nuevo
          const newLink = {
            url,
            createdBy: adminId,
            createdAt: Timestamp.now(),
            ...(eventId && { eventId }),
          };
          const docRef = await addDoc(collection(db, "payment_links"), newLink);
          return docRef.id;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al guardar link de pago";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Crear registro de pago
  const createPayment = useCallback(
    async (userId: string, eventId: string, amount: number) => {
      setLoading(true);
      setError(null);
      try {
        const payment = {
          userId,
          eventId,
          amount,
          status: "pending" as const,
          createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, "payments"), payment);
        return docRef.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al crear pago";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Subir comprobante de pago
  const uploadPaymentProof = useCallback(
    async (paymentId: string, imageUri: string, fileName: string) => {
      setLoading(true);
      setError(null);
      try {
        // Convertir URI a blob
        const response = await fetch(imageUri);
        const blob = await response.blob();

        // Subir a Firebase Storage
        const storageRef = ref(storage, `payment_proofs/${paymentId}/${fileName}`);
        await uploadBytes(storageRef, blob);

        // Obtener URL de descarga
        const downloadUrl = await getDownloadURL(storageRef);

        // Actualizar documento de pago
        const paymentRef = doc(db, "payments", paymentId);
        await updateDoc(paymentRef, {
          proofUrl: downloadUrl,
          status: "paid",
        });

        return downloadUrl;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al subir comprobante";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Verificar pago (solo admin)
  const verifyPayment = useCallback(
    async (paymentId: string, adminId: string, notes?: string) => {
      setLoading(true);
      setError(null);
      try {
        const paymentRef = doc(db, "payments", paymentId);
        await updateDoc(paymentRef, {
          status: "verified",
          verifiedBy: adminId,
          verifiedAt: Timestamp.now(),
          ...(notes && { notes }),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al verificar pago";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Obtener pagos de un usuario
  const getUserPayments = useCallback(async (userId: string) => {
    try {
      const q = query(
        collection(db, "payments"),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        verifiedAt: doc.data().verifiedAt?.toDate?.() || undefined,
      } as Payment));
    } catch (err) {
      throw err;
    }
  }, []);

  // Obtener pagos de un evento (solo admin)
  const getEventPayments = useCallback(async (eventId: string) => {
    try {
      const q = query(
        collection(db, "payments"),
        where("eventId", "==", eventId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        verifiedAt: doc.data().verifiedAt?.toDate?.() || undefined,
      } as Payment));
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    getPaymentLink,
    setPaymentLink,
    createPayment,
    uploadPaymentProof,
    verifyPayment,
    getUserPayments,
    getEventPayments,
  };
}
