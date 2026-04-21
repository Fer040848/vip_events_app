import { useCallback } from 'react';
import { Linking, Platform } from 'react-native';
import { trpc } from '@/lib/trpc';
import { useAuth } from './use-auth';

/**
 * Hook para manejar clicks en links de pago con tracking
 */
export function usePaymentLink() {
  const { user } = useAuth();
  const trackClickMutation = trpc.payments.trackClick.useMutation();

  const openPaymentLink = useCallback(
    async (paymentLinkId: number, eventId: number, url: string) => {
      try {
        // Registrar el click en la base de datos
        if (user?.id) {
          trackClickMutation.mutate({
            paymentLinkId,
            userId: user.id,
            eventId,
            userAgent: Platform.OS,
          });
        }

        // Abrir el link en el navegador
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          console.error('No se puede abrir el link:', url);
        }
      } catch (error) {
        console.error('Error abriendo link de pago:', error);
      }
    },
    [user?.id, trackClickMutation]
  );

  return {
    openPaymentLink,
    isTracking: trackClickMutation.isPending,
  };
}
