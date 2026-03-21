import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { data: me } = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login" as any);
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    if (!loading && isAuthenticated && me && (me as any)?.role !== "admin") {
      router.replace("/(tabs)" as any);
    }
  }, [isAuthenticated, loading, me]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#C9A84C",
        tabBarInactiveTintColor: "#8A7A5A",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: "#0A0A0A",
          borderTopColor: "#C9A84C22",
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.3,
        },
      }}
    >
      {/* Dashboard - Principal */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.bar.fill" color={color} />,
        }}
      />

      {/* Eventos - Gestión de eventos */}
      <Tabs.Screen
        name="events"
        options={{
          title: "Eventos",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="calendar" color={color} />,
        }}
      />

      {/* Invitados - Gestión de pagos y asistencia */}
      <Tabs.Screen
        name="guests"
        options={{
          title: "Invitados",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.2.fill" color={color} />,
        }}
      />

      {/* Chat - Comunicación en tiempo real */}
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="bubble.left.and.bubble.right.fill" color={color} />,
        }}
      />

      {/* Las siguientes pantallas no aparecen en el tab bar pero son accesibles desde el menú lateral */}
      {/* Scan - Escanear QR */}
      <Tabs.Screen
        name="scan"
        options={{
          href: null, // Ocultar del tab bar
          title: "Escanear",
        }}
      />

      {/* Notifications - Notificaciones */}
      <Tabs.Screen
        name="notifications"
        options={{
          href: null, // Ocultar del tab bar
          title: "Notificaciones",
        }}
      />

      {/* Orders - Pedidos/Órdenes */}
      <Tabs.Screen
        name="orders"
        options={{
          href: null, // Ocultar del tab bar
          title: "Pedidos",
        }}
      />

      {/* Access Codes - Generación de códigos (solo admin) */}
      <Tabs.Screen
        name="access-codes"
        options={{
          href: null, // Ocultar del tab bar
          title: "Códigos",
        }}
      />

      {/* Payments - Gestión de pagos (solo admin) */}
      <Tabs.Screen
        name="payments"
        options={{
          href: null, // Ocultar del tab bar
          title: "Pagos",
        }}
      />

      {/* VIP Products - Editar productos VIP (solo admin) */}
      <Tabs.Screen
        name="vip-products"
        options={{
          href: null, // Ocultar del tab bar
          title: "Productos VIP",
        }}
      />
    </Tabs>
  );
}
