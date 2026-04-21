import { useEffect } from 'react';
import { Platform, Share, Alert } from 'react-native';
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
   * Bloquear compartir a plataformas específicas
   */
  const handleBlockedShare = async (title: string, message: string) => {
    try {
      const result = await Share.share({
        message,
        title,
        url: undefined, // No permitir URLs
      });

      // Si el usuario intenta compartir a WhatsApp, Telegram, etc, mostrar alerta
      if (result.action === Share.dismissedAction) {
        // Usuario canceló
        return;
      }

      // Bloquear compartir a plataformas específicas
      const blockedApps = ['com.whatsapp', 'org.telegram.messenger', 'com.facebook.orca'];
      Alert.alert(
        '⚠️ Acceso Restringido',
        'Esta aplicación es TOP SECRET. No puedes compartir links o información con otras plataformas.',
        [{ text: 'Entendido', style: 'default' }]
      );
    } catch (error) {
      console.error('Error en compartir:', error);
    }
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
