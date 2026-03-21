import { useAuth } from '@/hooks/use-auth';

const MASTER_ADMIN_CODE = 'TLC001';

export function useAdminPermissions() {
  const { user } = useAuth();

  const isMasterAdmin = () => {
    return (user as any)?.role === 'admin' && (user as any)?.code === MASTER_ADMIN_CODE;
  };

  const isAdmin = () => {
    return (user as any)?.role === 'admin'
  };

  const canCreateEvents = () => {
    return isAdmin();
  };

  const canEditEvents = () => {
    return isAdmin();
  };

  const canDeleteEvents = () => {
    return isMasterAdmin();
  };

  const canCreateProducts = () => {
    return isAdmin();
  };

  const canEditProducts = () => {
    return isAdmin();
  };

  const canDeleteProducts = () => {
    return isMasterAdmin();
  };

  const canCreateCodes = () => {
    return isAdmin();
  };

  const canEditCodes = () => {
    return isMasterAdmin();
  };

  const canDeleteCodes = () => {
    return isMasterAdmin();
  };

  const canManageUsers = () => {
    return isAdmin();
  };

  const canVerifyPayments = () => {
    return isAdmin();
  };

  const canAccessAllFeatures = () => {
    return isMasterAdmin();
  };

  return {
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
    canManageUsers: canManageUsers(),
    canVerifyPayments: canVerifyPayments(),
    canAccessAllFeatures: canAccessAllFeatures(),
  };
}
