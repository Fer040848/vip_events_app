import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from './ui/icon-symbol';

const SIDEBAR_WIDTH = 280;

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  icon: string;
  href: string;
  badge?: number;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const colors = useColors();
  const router = useRouter();
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'chart.bar.fill', href: '/(admin)' },
    { label: 'Eventos', icon: 'calendar', href: '/(admin)/events' },
    { label: 'Invitados', icon: 'person.2.fill', href: '/(admin)/guests' },
    { label: 'Productos VIP', icon: 'star.fill', href: '/(admin)/vip-products' },
    { label: 'Pedidos', icon: 'bag.fill', href: '/(admin)/orders' },
    { label: 'Links de Pago', icon: 'creditcard.fill', href: '/(admin)/payment-links' },
    { label: 'Chat', icon: 'bubble.left.and.bubble.right.fill', href: '/(admin)/chat' },
    { label: 'Escanear QR', icon: 'qrcode', href: '/(admin)/scan' },
    { label: 'Notificaciones', icon: 'bell.fill', href: '/(admin)/notifications' },
    { label: 'Códigos de Acceso', icon: 'key.fill', href: '/(admin)/access-codes' },
  ];

  const handleNavigate = (href: string) => {
    router.push(href as any);
    onClose();
  };

  const isActive = (href: string) => pathname === href;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <TouchableOpacity
        style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
        onPress={onClose}
        activeOpacity={1}
      />

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            width: SIDEBAR_WIDTH,
            backgroundColor: colors.background,
            borderRightColor: colors.border,
          },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={[styles.sidebarHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sidebarTitle, { color: colors.primary }]}>
              ⚙️ ADMIN
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeBtnText, { color: colors.muted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item) => {
              const active = isActive(item.href);
              return (
                <TouchableOpacity
                  key={item.href}
                  style={[
                    styles.menuItem,
                    active && {
                      backgroundColor: `${colors.primary}20`,
                      borderLeftColor: colors.primary,
                      borderLeftWidth: 4,
                    },
                  ]}
                  onPress={() => handleNavigate(item.href)}
                >
                  <View style={styles.menuItemContent}>
                    <Text style={[styles.menuItemIcon, { color: active ? colors.primary : colors.muted }]}>
                      {item.icon === 'chart.bar.fill' && '📊'}
                      {item.icon === 'calendar' && '📅'}
                      {item.icon === 'person.2.fill' && '👥'}
                      {item.icon === 'star.fill' && '⭐'}
                      {item.icon === 'bag.fill' && '🛍️'}
                      {item.icon === 'creditcard.fill' && '💳'}
                      {item.icon === 'bubble.left.and.bubble.right.fill' && '💬'}
                      {item.icon === 'qrcode' && '📱'}
                      {item.icon === 'bell.fill' && '🔔'}
                      {item.icon === 'key.fill' && '🔑'}
                    </Text>
                    <Text
                      style={[
                        styles.menuItemLabel,
                        {
                          color: active ? colors.primary : colors.foreground,
                          fontWeight: active ? '600' : '500',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {item.badge && (
                    <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer Info */}
          <View style={[styles.sidebarFooter, { borderTopColor: colors.border }]}>
            <Text style={[styles.footerText, { color: colors.muted }]}>
              🔒 Área restringida
            </Text>
            <Text style={[styles.footerSubtext, { color: colors.muted }]}>
              Solo para administradores
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 98,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 99,
    borderRightWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 20,
    fontWeight: '600',
  },
  menuContainer: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  menuItemIcon: {
    fontSize: 18,
  },
  menuItemLabel: {
    fontSize: 14,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  sidebarFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 16,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
  },
});
