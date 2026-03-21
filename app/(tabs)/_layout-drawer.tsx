import React, { useState } from 'react';
import { View, Dimensions, Platform } from 'react-native';
import { GestureHandlerRootView, DrawerLayoutAndroid } from 'react-native-gesture-handler';
import { Stack, useRouter, Tabs } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { SidebarDrawer } from '@/components/sidebar-drawer';

const DRAWER_WIDTH = 280;

export default function DrawerLayout() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = React.useRef<DrawerLayoutAndroid>(null);

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login' as any);
    }
  }, [isAuthenticated, loading]);

  const isAdmin = (user as any)?.role === 'admin' || (user as any)?.type === 'admin';

  const renderDrawer = () => (
    <SidebarDrawer isAdmin={isAdmin} onClose={() => drawerRef.current?.closeDrawer()} />
  );

  if (Platform.OS === 'web') {
    // Web version with side-by-side layout
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ width: DRAWER_WIDTH, backgroundColor: '#0A0A0A' }}>
          <SidebarDrawer isAdmin={isAdmin} />
        </View>
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </View>
      </View>
    );
  }

  // Native version with drawer
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DrawerLayoutAndroid
        ref={drawerRef}
        drawerWidth={DRAWER_WIDTH}
        drawerPosition="left"
        renderNavigationView={renderDrawer}
      >
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </DrawerLayoutAndroid>
    </GestureHandlerRootView>
  );
}
