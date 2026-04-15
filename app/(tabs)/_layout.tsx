import React, { useState } from 'react';
import { View, Platform, TouchableOpacity, StyleSheet, Animated, Dimensions, Text } from 'react-native';
import { GestureHandlerRootView, DrawerLayoutAndroid } from 'react-native-gesture-handler';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/use-auth';
import { SidebarDrawer } from '@/components/sidebar-drawer';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Haptics from 'expo-haptics';

const DRAWER_WIDTH = 280;

export default function TabLayout() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const drawerRef = React.useRef<DrawerLayoutAndroid>(null);
  const [webDrawerOpen, setWebDrawerOpen] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login' as any);
    }
  }, [isAuthenticated, loading]);

  const isAdmin = (user as any)?.role === 'admin' || (user as any)?.type === 'admin';

  const renderDrawer = () => (
    <SidebarDrawer 
      isAdmin={isAdmin} 
      onClose={() => {
        if (Platform.OS === 'web') {
          toggleWebDrawer();
        } else {
          drawerRef.current?.closeDrawer();
        }
      }} 
    />
  );

  const toggleWebDrawer = () => {
    const isOpen = webDrawerOpen;
    setWebDrawerOpen(!isOpen);
    Animated.timing(slideAnim, {
      toValue: isOpen ? -DRAWER_WIDTH : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const openDrawer = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (Platform.OS === 'web') {
      toggleWebDrawer();
    } else {
      drawerRef.current?.openDrawer();
    }
  };

  const bottomPadding = Platform.OS === 'web' ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  const tabsContent = (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#0A0A0A',
        },
        headerTintColor: '#C9A84C',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: '#C9A84C',
        },
        headerLeft: () => (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={openDrawer}
            activeOpacity={0.7}
          >
            <IconSymbol name="line.3.horizontal" size={24} color="#C9A84C" />
          </TouchableOpacity>
        ),
        tabBarActiveTintColor: '#C9A84C',
        tabBarInactiveTintColor: '#8A8A8A',
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: '#0A0A0A',
          borderTopColor: '#2A2A2A',
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerTitle: 'After Room',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Eventos',
          headerTitle: 'Eventos',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-qr"
        options={{
          title: 'Mi QR',
          headerTitle: 'Mi QR',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="qrcode" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          headerTitle: 'Chat',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="message.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          headerTitle: 'Mi Perfil',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
        }}
      />
      {/* Pantallas ocultas del tab bar */}
      <Tabs.Screen
        name="vip-orders"
        options={{
          href: null,
          headerTitle: 'Servicio VIP',
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          href: null,
          headerTitle: 'Leaderboard',
        }}
      />
      <Tabs.Screen
        name="user-profile"
        options={{
          href: null,
          headerTitle: 'Perfil de Usuario',
        }}
      />
      <Tabs.Screen
        name="_layout-drawer"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );

  // Web layout with animated drawer
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1 }}>
        {/* Overlay backdrop */}
        {webDrawerOpen && (
          <TouchableOpacity
            style={styles.webBackdrop}
            onPress={toggleWebDrawer}
            activeOpacity={0.5}
          />
        )}

        {/* Animated drawer */}
        <Animated.View
          style={[
            styles.webDrawerContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {renderDrawer()}
        </Animated.View>

        {/* Main content with tabs */}
        {tabsContent}
      </View>
    );
  }

  // Native layout with DrawerLayoutAndroid
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DrawerLayoutAndroid
        ref={drawerRef}
        drawerWidth={DRAWER_WIDTH}
        drawerPosition="left"
        renderNavigationView={renderDrawer}
        drawerLockMode="unlocked"
      >
        {tabsContent}
      </DrawerLayoutAndroid>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webDrawerContainer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#0A0A0A',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  webBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
});
