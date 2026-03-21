import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MASTER_ADMIN_CODE = 'tlc001';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  code: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string;
}

export function useAdminPermissions() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos del usuario desde AsyncStorage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user_data');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const isMasterAdmin = useCallback(() => {
    if (!user) return false;
    return user.isAdmin && user.code.toLowerCase() === MASTER_ADMIN_CODE;
  }, [user]);

  const isAdmin = useCallback(() => {
    return user?.isAdmin ?? false;
  }, [user]);

  const canCreateEvents = useCallback(() => {
    return isAdmin();
  }, [isAdmin]);

  const canEditEvents = useCallback(() => {
    return isAdmin();
  }, [isAdmin]);

  const canDeleteEvents = useCallback(() => {
    return isMasterAdmin();
  }, [isMasterAdmin]);

  const canCreateProducts = useCallback(() => {
    return isAdmin();
  }, [isAdmin]);

  const canEditProducts = useCallback(() => {
    return isAdmin();
  }, [isAdmin]);

  const canDeleteProducts = useCallback(() => {
    return isMasterAdmin();
  }, [isMasterAdmin]);

  const canCreateCodes = useCallback(() => {
    return isAdmin();
  }, [isAdmin]);

  const canEditCodes = useCallback(() => {
    return isMasterAdmin();
  }, [isMasterAdmin]);

  const canDeleteCodes = useCallback(() => {
    return isMasterAdmin();
  }, [isMasterAdmin]);

  const canManageGuests = useCallback(() => {
    return isAdmin();
  }, [isAdmin]);

  const canVerifyPayments = useCallback(() => {
    return isAdmin();
  }, [isAdmin]);

  return {
    user,
    loading,
    isMasterAdmin: isMasterAdmin(),
    isAdmin: isAdmin(),
    canCreateEvents: canCreateEvents(),
    canEditEvents: canEditEvents(),
    canDeleteEvents: canDeleteEvents(),
    canCreateProducts: canCreateProducts(),
    canEditProducts: canEditProducts(),
    canDeleteProducts: canDeleteProducts(),
    canCreateCodes: canCreateCodes(),
    canEditCodes: canEditCodes(),
    canDeleteCodes: canDeleteCodes(),
    canManageGuests: canManageGuests(),
    canVerifyPayments: canVerifyPayments(),
  };
}
