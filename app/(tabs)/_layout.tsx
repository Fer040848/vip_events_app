import React from 'react';
import { View, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { GestureHandlerRootView, DrawerLayoutAndroid } from 'react-native-gesture-handler';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { SidebarDrawer } from '@/components/sidebar-drawer';
import { IconSymbol } from '@/components/ui/icon-symbol';

const DRAWER_WIDTH = 280;

export default function TabLayout() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
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

  const MenuButton = () => (
    <TouchableOpacity
      style={styles.menuButton}
      onPress={() => drawerRef.current?.openDrawer()}
    >
      <IconSymbol name="line.3.horizontal" size={24} color="#C9A84C" />
    </TouchableOpacity>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ width: DRAWER_WIDTH, backgroundColor: '#0A0A0A' }}>
          <SidebarDrawer isAdmin={isAdmin} />
        </View>
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </View>
    );
  }

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
            headerShown: true,
            headerStyle: {
              backgroundColor: '#0A0A0A',
            },
            headerTintColor: '#C9A84C',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 18,
            },
            headerLeft: () => <MenuButton />,
            headerTitle: 'After Room',
          }}
        />
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
});
