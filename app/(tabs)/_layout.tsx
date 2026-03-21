import React, { useState } from 'react';
import { View, Platform, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { GestureHandlerRootView, DrawerLayoutAndroid } from 'react-native-gesture-handler';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { SidebarDrawer } from '@/components/sidebar-drawer';
import { IconSymbol } from '@/components/ui/icon-symbol';

const DRAWER_WIDTH = 280;
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function TabLayout() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
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

  const MenuButton = () => (
    <TouchableOpacity
      style={styles.menuButton}
      onPress={() => {
        if (Platform.OS === 'web') {
          toggleWebDrawer();
        } else {
          drawerRef.current?.openDrawer();
        }
      }}
      activeOpacity={0.7}
    >
      <IconSymbol name="line.3.horizontal" size={24} color="#C9A84C" />
    </TouchableOpacity>
  );

  // Web layout with animated drawer
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
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

        {/* Main content */}
        <View style={{ flex: 1, flexDirection: 'column' }}>
          {/* Header with menu button */}
          <View style={styles.webHeader}>
            <MenuButton />
            <View style={styles.webHeaderTitle}>
              <IconSymbol name="crown.fill" size={20} color="#C9A84C" />
            </View>
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        </View>
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
  webHeader: {
    height: 60,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  webHeaderTitle: {
    flex: 1,
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
