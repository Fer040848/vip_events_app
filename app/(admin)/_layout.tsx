import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { DrawerLayoutAndroid, GestureHandlerRootView } from "react-native-gesture-handler";
import { Tabs, useRouter } from "expo-router";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { AdminErrorBoundary } from "@/components/admin-data-state";
import { SidebarDrawer } from "@/components/sidebar-drawer";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

const DRAWER_WIDTH = 280;

export default function AdminLayout() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const drawerRef = useRef<DrawerLayoutAndroid>(null);
  const [webDrawerOpen, setWebDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const { data: me } = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login" as any);
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const role = (me as { role?: string } | undefined)?.role ?? (user as { role?: string } | null)?.role;
    if (!loading && isAuthenticated && role && role !== "admin") {
      router.replace("/(tabs)" as any);
    }
  }, [isAuthenticated, loading, me, router, user]);

  const toggleWebDrawer = () => {
    const willOpen = !webDrawerOpen;
    setWebDrawerOpen(willOpen);
    Animated.timing(slideAnim, {
      toValue: willOpen ? 0 : -DRAWER_WIDTH,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    if (Platform.OS === "web") {
      if (webDrawerOpen) toggleWebDrawer();
      return;
    }
    drawerRef.current?.closeDrawer();
  };

  const openDrawer = () => {
    if (Platform.OS === "web") {
      toggleWebDrawer();
      return;
    }
    drawerRef.current?.openDrawer();
  };

  const renderDrawer = () => <SidebarDrawer isAdmin onClose={closeDrawer} />;

  const adminContent = (
    <AdminErrorBoundary>
      <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: styles.header,
        headerTintColor: "#C9A84C",
        headerTitleStyle: styles.headerTitle,
        headerLeft: () => (
          <TouchableOpacity style={styles.menuButton} onPress={openDrawer} activeOpacity={0.7}>
            <IconSymbol name="line.3.horizontal" size={24} color="#C9A84C" />
          </TouchableOpacity>
        ),
        tabBarStyle: styles.hiddenTabBar,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Panel de Administración", headerTitle: "After Room · Admin" }} />
      <Tabs.Screen name="events" options={{ title: "Eventos" }} />
      <Tabs.Screen name="guests" options={{ title: "Invitados" }} />
      <Tabs.Screen name="vip-products" options={{ title: "Productos VIP" }} />
      <Tabs.Screen name="vip-products-edit" options={{ title: "Editar productos VIP" }} />
      <Tabs.Screen name="orders" options={{ title: "Pedidos VIP" }} />
      <Tabs.Screen name="payment-links" options={{ title: "Links de pago" }} />
      <Tabs.Screen name="payments" options={{ title: "Confirmaciones de pago" }} />
      <Tabs.Screen name="access-codes" options={{ title: "Códigos de acceso" }} />
      <Tabs.Screen name="generate-codes" options={{ title: "Generar códigos" }} />
      <Tabs.Screen name="scan" options={{ title: "Escanear QR" }} />
      <Tabs.Screen name="notifications" options={{ title: "Notificaciones" }} />
      <Tabs.Screen name="chat" options={{ title: "Chat administrativo" }} />
      </Tabs>
    </AdminErrorBoundary>
  );

  if (Platform.OS === "web") {
    return (
      <View style={styles.root}>
        {webDrawerOpen && (
          <TouchableOpacity style={styles.webBackdrop} onPress={closeDrawer} activeOpacity={1} />
        )}
        <Animated.View
          style={[styles.webDrawerContainer, { transform: [{ translateX: slideAnim }] }]}
        >
          {renderDrawer()}
        </Animated.View>
        {adminContent}
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <DrawerLayoutAndroid
        ref={drawerRef}
        drawerWidth={DRAWER_WIDTH}
        drawerPosition="left"
        drawerLockMode="unlocked"
        renderNavigationView={renderDrawer}
      >
        {adminContent}
      </DrawerLayoutAndroid>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  header: {
    backgroundColor: "#0A0A0A",
  },
  headerTitle: {
    color: "#C9A84C",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  menuButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  hiddenTabBar: {
    display: "none",
  },
  webBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.58)",
    zIndex: 100,
  },
  webDrawerContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: "#0A0A0A",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    zIndex: 101,
  },
});
