import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { trpc } from '@/lib/trpc';

// Configurar el handler global para notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Mutation para guardar el token en el servidor
  const { mutate: savePushToken } = trpc.users.savePushToken.useMutation();

  useEffect(() => {
    // Registrar para notificaciones push
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        // Guardar token en el servidor
        savePushToken({ token });
      }
    });

    // Listener para notificaciones recibidas en foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Listener para cuando el usuario toca una notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      // Aquí puedes manejar la navegación basada en la notificación
    });

    // Limpiar listeners al desmontar
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
}

async function registerForPushNotificationsAsync() {
  let token: string | null = null;

  // Crear canal de notificación para Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C9A84C',
    });
  }

  // Verificar si el dispositivo es físico
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return null;
  }

  // Solicitar permisos
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get push notification permission');
    return null;
  }

  // Obtener token de Expo
  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      console.warn('Project ID not found for push notifications');
      return null;
    }

    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;

    console.log('Expo push token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }

  return token;
}
