import { useCallback, useState } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  QueryConstraint,
  DocumentData,
  CollectionReference,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UseFirestoreOptions {
  collectionName: string;
}

export function useFirestore({ collectionName }: UseFirestoreOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = useCallback(
    async (data: DocumentData) => {
      try {
        setLoading(true);
        setError(null);
        const ref = collection(db, collectionName) as CollectionReference;
        const docRef = await addDoc(ref, {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return docRef.id;
      } catch (err: any) {
        const errorMessage = err.message || 'Error al agregar documento';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  const update = useCallback(
    async (docId: string, data: DocumentData) => {
      try {
        setLoading(true);
        setError(null);
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, {
          ...data,
          updatedAt: new Date(),
        });
      } catch (err: any) {
        const errorMessage = err.message || 'Error al actualizar documento';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  const remove = useCallback(
    async (docId: string) => {
      try {
        setLoading(true);
        setError(null);
        const docRef = doc(db, collectionName, docId);
        await deleteDoc(docRef);
      } catch (err: any) {
        const errorMessage = err.message || 'Error al eliminar documento';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  const getAll = useCallback(
    async (constraints: QueryConstraint[] = []) => {
      try {
        setLoading(true);
        setError(null);
        const ref = collection(db, collectionName) as CollectionReference;
        const q = query(ref, ...constraints);
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (err: any) {
        const errorMessage = err.message || 'Error al obtener documentos';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  const getById = useCallback(
    async (docId: string) => {
      try {
        setLoading(true);
        setError(null);
        const docRef = doc(db, collectionName, docId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          return {
            id: snapshot.id,
            ...snapshot.data(),
          };
        }
        return null;
      } catch (err: any) {
        const errorMessage = err.message || 'Error al obtener documento';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  return {
    loading,
    error,
    add,
    update,
    remove,
    getAll,
    getById,
  };
}
