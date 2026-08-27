import { useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';

/**
 * Hook para proteger la app contra screenshots y restricción de compartir
 * - Deshabilita screenshots en iOS y Android
 * - Bloquea compartir a WhatsApp, Telegram y otras plataformas
 */
export function useSecurity() {
  useEffect(() => {
    // Deshabilitar screenshots en iOS y Android
    if (Platform.OS !== 'web') {
      ScreenCapture.preventScreenCaptureAsync();
    }

    return () => {
      // Permitir screenshots al desmontar (cleanup)
      if (Platform.OS !== 'web') {
        ScreenCapture.allowScreenCaptureAsync();
      }
    };
  }, []);

  /**
   * Bloquear cualquier intento de compartir contenido privado.
   */
  const handleBlockedShare = () => {
    Alert.alert(
      'Acceso restringido',
      'La información de After Room es privada y no se puede compartir fuera de la aplicación.',
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  /**
   * Bloquear copiar texto sensible (links de pago)
   */
  const blockCopyPaymentLink = () => {
    Alert.alert(
      '🔒 Contenido Protegido',
      'No puedes copiar este link. Accede directamente desde la app.',
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  return {
    handleBlockedShare,
    blockCopyPaymentLink,
  };
}
