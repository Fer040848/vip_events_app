import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

interface SidebarDrawerProps {
  isAdmin: boolean;
  onClose?: () => void;
}

export function SidebarDrawer({ isAdmin, onClose }: SidebarDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();

  const userMenuItems: MenuItem[] = [
    { label: 'Inicio', icon: 'house.fill', route: '/(tabs)' },
    { label: 'Eventos', icon: 'calendar', route: '/(tabs)/events' },
    { label: 'Mi QR', icon: 'qrcode', route: '/(tabs)/my-qr' },
    { label: 'Productos VIP', icon: 'crown.fill', route: '/(tabs)/vip-orders' },
    { label: 'Chat', icon: 'bubble.left.and.bubble.right.fill', route: '/(tabs)/chat' },
    { label: 'Perfil', icon: 'person.fill', route: '/(tabs)/profile' },
  ];

  const adminMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'chart.bar.fill', route: '/(admin)' },
    { label: 'Eventos', icon: 'calendar', route: '/(admin)/events' },
    { label: 'Invitados', icon: 'person.2.fill', route: '/(admin)/guests' },
    { label: 'Códigos', icon: 'key.fill', route: '/(admin)/access-codes', adminOnly: true },
    { label: 'Pagos', icon: 'creditcard.fill', route: '/(admin)/payments', adminOnly: true },
    { label: 'Productos VIP', icon: 'crown.fill', route: '/(admin)/vip-products', adminOnly: true },
    { label: 'Chat', icon: 'bubble.left.and.bubble.right.fill', route: '/(admin)/chat' },
  ];

  // Filtrar items: mostrar solo items de admin si isAdmin es true
  const menuItems = isAdmin 
    ? adminMenuItems 
    : userMenuItems.filter(item => !item.adminOnly);

  const handleNavigate = (route: string) => {
    router.push(route as any);
    onClose?.();
  };

  const isActive = (route: string) => pathname.includes(route.split('/').pop() || '');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <IconSymbol name="crown.fill" size={24} color="#C9A84C" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>After Room</Text>
            <Text style={styles.headerSubtitle}>{isAdmin ? '👑 Admin' : '👤 Usuario'}</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, isActive(item.route) && styles.menuItemActive]}
            onPress={() => handleNavigate(item.route)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <IconSymbol
                name={item.icon as any}
                size={20}
                color={isActive(item.route) ? '#C9A84C' : '#8A7A5A'}
              />
            </View>
            <Text style={[styles.menuLabel, isActive(item.route) && styles.menuLabelActive]}>
              {item.label}
            </Text>
            {item.adminOnly && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>👑</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={() => router.push('/login' as any)}
          activeOpacity={0.7}
        >
          <IconSymbol name="arrow.right.circle.fill" size={20} color="#EF4444" />
          <Text style={styles.logoutLabel}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    borderRightColor: '#2A2A2A',
    borderRightWidth: 1,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomColor: '#2A2A2A',
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#C9A84C',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8A7A5A',
    marginTop: 2,
    fontWeight: '500',
  },
  menuContainer: {
    flex: 1,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    borderLeftColor: '#C9A84C',
    borderLeftWidth: 3,
    paddingLeft: 13,
  },
  menuIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 14,
    color: '#8A7A5A',
    fontWeight: '500',
    flex: 1,
  },
  menuLabelActive: {
    color: '#C9A84C',
    fontWeight: '600',
  },
  adminBadge: {
    backgroundColor: 'rgba(201, 168, 76, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 12,
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopColor: '#2A2A2A',
    borderTopWidth: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    gap: 12,
  },
  logoutLabel: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
});
