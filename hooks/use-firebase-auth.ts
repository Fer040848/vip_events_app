import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useFirebaseAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Enable persistence
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('Error setting persistence:', error);
    });

    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setState({
          user,
          loading: false,
          error: null,
        });
      },
      (error) => {
        setState({
          user: null,
          loading: false,
          error: error.message,
        });
      }
    );

    return unsubscribe;
  }, []);

  const register = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setState({
        user: userCredential.user,
        loading: false,
        error: null,
      });
      return userCredential.user;
    } catch (error: any) {
      const errorMessage = error.message || 'Error al registrar usuario';
      setState({
        user: null,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setState({
        user: userCredential.user,
        loading: false,
        error: null,
      });
      return userCredential.user;
    } catch (error: any) {
      const errorMessage = error.message || 'Error al iniciar sesión';
      setState({
        user: null,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await signOut(auth);
      setState({
        user: null,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Error al cerrar sesión';
      setState({
        user: null,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  };

  return {
    ...state,
    register,
    login,
    logout,
  };
}
