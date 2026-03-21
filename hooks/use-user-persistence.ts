import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserData {
  id: string;
  name: string;
  email?: string;
  code: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string;
}

const STORAGE_KEY = 'afterroom_user_data';

export function useUserPersistence() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos de usuario guardados
  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const userData = JSON.parse(savedData) as UserData;
        setUser(userData);
        return userData;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  // Guardar datos de usuario
  const saveUser = useCallback(async (userData: UserData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }, []);

  // Actualizar datos de usuario
  const updateUser = useCallback(async (updates: Partial<UserData>) => {
    if (!user) throw new Error('No user data to update');
    const updatedUser = { ...user, ...updates };
    return saveUser(updatedUser);
  }, [user, saveUser]);

  // Limpiar datos de usuario (logout)
  const clearUser = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    user,
    loading,
    saveUser,
    updateUser,
    clearUser,
    loadUser,
  };
}
