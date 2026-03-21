import { useCallback, useState } from "react";
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface VIPProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  isActive: boolean;
}

export interface VIPRequest {
  id: string;
  userId: string;
  productId: string;
  eventId: string;
  quantity: number;
  status: "pending" | "approved" | "rejected" | "completed";
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export function useVIPProducts() {
  const [products, setProducts] = useState<VIPProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener todos los productos VIP
  const fetchProducts = useCallback(async (eventId?: string) => {
    setLoading(true);
    setError(null);
    try {
      let q;
      if (eventId) {
        q = query(
          collection(db, "vip_products"),
          where("isActive", "==", true),
          where("eventId", "==", eventId)
        );
      } else {
        q = query(
          collection(db, "vip_products"),
          where("isActive", "==", true)
        );
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || undefined,
      } as VIPProduct));
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener productos");
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear producto VIP (solo admin)
  const createProduct = useCallback(
    async (
      name: string,
      description: string,
      price: number,
      category: string,
      adminId: string,
      eventId?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const product = {
          name,
          description,
          price,
          category,
          createdBy: adminId,
          createdAt: Timestamp.now(),
          isActive: true,
          ...(eventId && { eventId }),
        };

        const docRef = await addDoc(collection(db, "vip_products"), product);
        await fetchProducts(eventId);
        return docRef.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al crear producto";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchProducts]
  );

  // Editar producto VIP (solo admin)
  const updateProduct = useCallback(
    async (
      productId: string,
      updates: Partial<Omit<VIPProduct, "id" | "createdBy" | "createdAt">>
    ) => {
      setLoading(true);
      setError(null);
      try {
        const productRef = doc(db, "vip_products", productId);
        await updateDoc(productRef, {
          ...updates,
          updatedAt: Timestamp.now(),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al actualizar producto";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Eliminar producto VIP (solo admin)
  const deleteProduct = useCallback(
    async (productId: string, eventId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const productRef = doc(db, "vip_products", productId);
        await updateDoc(productRef, { isActive: false });
        await fetchProducts(eventId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al eliminar producto";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchProducts]
  );

  // Crear solicitud de producto VIP
  const createVIPRequest = useCallback(
    async (
      userId: string,
      productId: string,
      eventId: string,
      quantity: number,
      notes?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const request = {
          userId,
          productId,
          eventId,
          quantity,
          status: "pending" as const,
          createdAt: Timestamp.now(),
          ...(notes && { notes }),
        };

        const docRef = await addDoc(collection(db, "vip_requests"), request);
        return docRef.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al crear solicitud";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Actualizar estado de solicitud VIP (solo admin)
  const updateVIPRequest = useCallback(
    async (
      requestId: string,
      status: "pending" | "approved" | "rejected" | "completed",
      notes?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const requestRef = doc(db, "vip_requests", requestId);
        await updateDoc(requestRef, {
          status,
          updatedAt: Timestamp.now(),
          ...(notes && { notes }),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al actualizar solicitud";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Obtener solicitudes de un usuario
  const getUserVIPRequests = useCallback(async (userId: string) => {
    try {
      const q = query(
        collection(db, "vip_requests"),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || undefined,
      } as VIPRequest));
    } catch (err) {
      throw err;
    }
  }, []);

  // Obtener solicitudes de un evento (solo admin)
  const getEventVIPRequests = useCallback(async (eventId: string) => {
    try {
      const q = query(
        collection(db, "vip_requests"),
        where("eventId", "==", eventId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || undefined,
      } as VIPRequest));
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    createVIPRequest,
    updateVIPRequest,
    getUserVIPRequests,
    getEventVIPRequests,
  };
}
