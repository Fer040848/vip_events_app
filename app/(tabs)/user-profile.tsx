import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useUserPersistence } from '@/hooks/use-user-persistence';
import * as Auth from '@/lib/_core/auth';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export default function UserProfileScreen() {
  const { user, loadUser } = useUserPersistence();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<Auth.User | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      await loadUser();
      setUserData(user);

      const info = await Auth.getUserInfo();
      setUserInfo(info);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            // Clear user data and redirect to login
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            router.replace('/login' as any);
          } catch (error) {
            Alert.alert('Error', 'No se pudo cerrar sesión');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#C9A84C" />
        <Text className="text-foreground mt-4">Cargando perfil...</Text>
      </ScreenContainer>
    );
  }

  const displayName = user?.name || userInfo?.name || 'Usuario';
  const displayEmail = user?.email || userInfo?.email || 'Sin email';
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-MX') : 'N/A';
  const lastLogin = user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-MX') : 'N/A';

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-4 pt-6 pb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">Mi Perfil</Text>
          <Text className="text-sm text-muted">Información de tu cuenta</Text>
        </View>

        {/* Profile Card */}
        <View className="px-4 mb-6">
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileEmail}>{displayEmail}</Text>
            </View>
          </View>
        </View>

        {/* Account Details */}
        <View className="px-4 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Detalles de Cuenta</Text>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Código de Acceso</Text>
              <Text style={styles.detailValue}>{user?.code?.toUpperCase() || 'N/A'}</Text>
            </View>

            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Tipo de Cuenta</Text>
              <Text style={[styles.detailValue, { color: user?.isAdmin ? '#C9A84C' : '#8A7A5A' }]}>
                {user?.isAdmin ? '👑 Administrador' : '👤 Usuario'}
              </Text>
            </View>
          </View>
        </View>

        {/* Activity */}
        <View className="px-4 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Actividad</Text>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fecha de Registro</Text>
              <Text style={styles.detailValue}>{joinDate}</Text>
            </View>

            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Último Acceso</Text>
              <Text style={styles.detailValue}>{lastLogin}</Text>
            </View>
          </View>
        </View>

        {/* Events History */}
        <View className="px-4 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Eventos Registrados</Text>

          <View style={styles.eventsCard}>
            <View style={styles.eventItem}>
              <Text style={styles.eventIcon}>🎉</Text>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>Próximamente</Text>
                <Text style={styles.eventSubtitle}>Tu historial de eventos aparecerá aquí</Text>
              </View>
            </View>
          </View>
        </View>

        {/* VIP Products */}
        <View className="px-4 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Mis Productos VIP</Text>

          <View style={styles.vipCard}>
            <View style={styles.vipItem}>
              <Text style={styles.vipIcon}>✨</Text>
              <View style={styles.vipInfo}>
                <Text style={styles.vipTitle}>Productos Solicitados</Text>
                <Text style={styles.vipSubtitle}>Gestiona tus solicitudes de productos VIP</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        <View className="px-4 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Estado de Pago</Text>

          <View style={styles.paymentCard}>
            <View style={styles.paymentStatus}>
              <Text style={styles.paymentIcon}>💳</Text>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>Estado Pendiente</Text>
                <Text style={styles.paymentSubtitle}>Verifica tu estado de pago con el administrador</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View className="px-4">
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>🚪 Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#C9A84C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0A0A0A',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F5E6C8',
  },
  profileEmail: {
    fontSize: 12,
    color: '#8A7A5A',
  },
  detailCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  detailLabel: {
    fontSize: 13,
    color: '#8A7A5A',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: '#F5E6C8',
    fontWeight: '700',
  },
  eventsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventIcon: {
    fontSize: 32,
  },
  eventInfo: {
    flex: 1,
    gap: 2,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F5E6C8',
  },
  eventSubtitle: {
    fontSize: 12,
    color: '#8A7A5A',
  },
  vipCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  vipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vipIcon: {
    fontSize: 32,
  },
  vipInfo: {
    flex: 1,
    gap: 2,
  },
  vipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F5E6C8',
  },
  vipSubtitle: {
    fontSize: 12,
    color: '#8A7A5A',
  },
  paymentCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIcon: {
    fontSize: 32,
  },
  paymentInfo: {
    flex: 1,
    gap: 2,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F5E6C8',
  },
  paymentSubtitle: {
    fontSize: 12,
    color: '#8A7A5A',
  },
  logoutButton: {
    backgroundColor: '#EF444422',
    borderWidth: 1,
    borderColor: '#EF444444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});
