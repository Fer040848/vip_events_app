import { useCallback, useState, useEffect } from "react";
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

export interface AccessCode {
  id: string;
  code: string;
  role: "admin" | "user";
  createdBy: string;
  createdAt: Date;
  usedBy?: string;
  usedAt?: Date;
  isActive: boolean;
}

export function useAccessCodes() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener todos los códigos (solo admin)
  const fetchAllCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "access_codes"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        usedAt: doc.data().usedAt?.toDate?.() || undefined,
      } as AccessCode));
      setCodes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener códigos");
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear nuevo código (solo admin)
  const createCode = useCallback(
    async (code: string, role: "admin" | "user", adminId: string) => {
      setLoading(true);
      setError(null);
      try {
        // Verificar que el código no exista
        const q = query(
          collection(db, "access_codes"),
          where("code", "==", code.toUpperCase())
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          throw new Error("Este código ya existe");
        }

        const newCode = {
          code: code.toUpperCase(),
          role,
          createdBy: adminId,
          createdAt: Timestamp.now(),
          isActive: true,
        };

        const docRef = await addDoc(collection(db, "access_codes"), newCode);
        return { id: docRef.id, ...newCode };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al crear código";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Validar código y obtener rol
  const validateCode = useCallback(async (code: string) => {
    try {
      const q = query(
        collection(db, "access_codes"),
        where("code", "==", code.toUpperCase()),
        where("isActive", "==", true)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error("Código inválido o inactivo");
      }

      const codeDoc = snapshot.docs[0];
      const data = codeDoc.data() as Omit<AccessCode, "id">;

      return {
        id: codeDoc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      } as AccessCode;
    } catch (err) {
      throw err;
    }
  }, []);

  // Marcar código como usado
  const markCodeAsUsed = useCallback(async (codeId: string, userId: string) => {
    try {
      const codeRef = doc(db, "access_codes", codeId);
      await updateDoc(codeRef, {
        usedBy: userId,
        usedAt: Timestamp.now(),
      });
    } catch (err) {
      throw err;
    }
  }, []);

  // Desactivar código (solo admin)
  const deactivateCode = useCallback(async (codeId: string) => {
    setLoading(true);
    setError(null);
    try {
      const codeRef = doc(db, "access_codes", codeId);
      await updateDoc(codeRef, { isActive: false });
      await fetchAllCodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al desactivar código");
    } finally {
      setLoading(false);
    }
  }, [fetchAllCodes]);

  // Eliminar código (solo admin)
  const deleteCode = useCallback(
    async (codeId: string) => {
      setLoading(true);
      setError(null);
      try {
        await deleteDoc(doc(db, "access_codes", codeId));
        await fetchAllCodes();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al eliminar código");
      } finally {
        setLoading(false);
      }
    },
    [fetchAllCodes]
  );

  return {
    codes,
    loading,
    error,
    fetchAllCodes,
    createCode,
    validateCode,
    markCodeAsUsed,
    deactivateCode,
    deleteCode,
  };
}
