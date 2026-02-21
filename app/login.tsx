import { useAuth } from "@/hooks/use-auth";
import { startOAuthLogin } from "@/constants/oauth";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#C9A84C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>VIP Events</Text>
        <Text style={styles.subtitle}>Tu acceso exclusivo al mundo VIP</Text>
      </View>

      <View style={styles.featuresContainer}>
        <FeatureRow icon="👑" text="Invitaciones exclusivas con QR personalizado" />
        <FeatureRow icon="🎫" text="Calendario de eventos VIP" />
        <FeatureRow icon="🍾" text="Servicio VIP durante el evento" />
        <FeatureRow icon="🔔" text="Notificaciones en tiempo real" />
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={startOAuthLogin}
          activeOpacity={0.85}
        >
          <Text style={styles.loginButtonText}>Acceder a VIP Events</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>
          Plataforma exclusiva para invitados VIP
        </Text>
      </View>
    </View>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    justifyContent: "space-between",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#C9A84C",
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#8A7A5A",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  featuresContainer: {
    gap: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 12,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    flex: 1,
    color: "#F5E6C8",
    fontSize: 14,
    lineHeight: 20,
  },
  bottomContainer: {
    alignItems: "center",
    gap: 12,
  },
  loginButton: {
    backgroundColor: "#C9A84C",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: "100%",
    alignItems: "center",
  },
  loginButtonText: {
    color: "#0A0A0A",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  disclaimer: {
    color: "#8A7A5A",
    fontSize: 12,
    textAlign: "center",
  },
});
