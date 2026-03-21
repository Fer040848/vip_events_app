import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import * as Auth from "@/lib/_core/auth";
import { getApiBaseUrl } from "@/constants/oauth";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import { useUserPersistence } from "@/hooks/use-user-persistence";

export default function LoginScreen() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const { saveUser } = useUserPersistence();

  const handleLogin = async () => {
    const trimmedCode = code.trim().toLowerCase();
    if (!trimmedCode) {
      setError("Por favor ingresa tu código de acceso.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/auth/code-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: trimmedCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Código inválido");
      }

      // Store session token for native
      if (Platform.OS !== "web" && data.app_session_id) {
        await Auth.setSessionToken(data.app_session_id);
      }

      // Store user info
      const userInfo: Auth.User = {
        id: data.user.id,
        openId: data.user.openId,
        name: data.user.name,
        email: data.user.email,
        loginMethod: data.user.loginMethod,
        lastSignedIn: new Date(data.user.lastSignedIn),
      };
      await Auth.setUserInfo(userInfo);

      // Guardar datos de usuario en persistencia local
      await saveUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        code: trimmedCode,
        isAdmin: data.role === 'admin',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Navigate based on role and name setup
      const hasSetName = data.user?.hasSetName;
      if (!hasSetName) {
        router.replace("/setup-name" as any);
      } else if (data.role === "admin") {
        router.replace("/(admin)");
      } else {
        router.replace("/(tabs)");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al ingresar";
      setError(message);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-black" edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Header */}
          <View style={styles.header}>
            <View style={styles.crownContainer}>
              <Text style={styles.crown}>♛</Text>
            </View>
            <Text style={styles.title}>After Room</Text>
            <Text style={styles.subtitle}>Plataforma Exclusiva</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Acceso VIP</Text>
            <Text style={styles.cardSubtitle}>
              Ingresa tu código de invitación para acceder a la plataforma exclusiva.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>CÓDIGO DE ACCESO</Text>
              <TextInput
                ref={inputRef}
                style={[styles.input, error ? styles.inputError : null]}
                value={code}
                onChangeText={(text) => {
                  setCode(text);
                  setError(null);
                }}
                placeholder=""
                placeholderTextColor="#555"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!loading}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.button, loading ? styles.buttonDisabled : null]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.buttonText}>INGRESAR</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.hint}>
              Tu código fue proporcionado al momento de tu invitación.
            </Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            {[
              { icon: "👑", text: "Invitaciones con QR personalizado" },
              { icon: "🎫", text: "Calendario de eventos VIP" },
              { icon: "🍾", text: "Servicio VIP durante el evento" },
              { icon: "💬", text: "Chat exclusivo en tiempo real" },
            ].map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.divider} />
            <Text style={styles.footerText}>ACCESO EXCLUSIVO · SOLO INVITADOS</Text>
            <View style={styles.divider} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: "#000",
  },
  header: {
    alignItems: "center",
    marginBottom: 36,
  },
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1a1500",
    borderWidth: 2,
    borderColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#C9A84C",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  crown: {
    fontSize: 36,
    color: "#C9A84C",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#C9A84C",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 12,
    color: "#888",
    letterSpacing: 4,
    textTransform: "uppercase",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: "#2a2200",
    shadowColor: "#C9A84C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: 1,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#888",
    lineHeight: 20,
    marginBottom: 28,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 10,
    color: "#C9A84C",
    letterSpacing: 2,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: "#fff",
    letterSpacing: 2,
    fontWeight: "600",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 8,
  },
  button: {
    backgroundColor: "#C9A84C",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#C9A84C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 2,
  },
  hint: {
    fontSize: 11,
    color: "#555",
    textAlign: "center",
    lineHeight: 16,
  },
  features: {
    gap: 10,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e1e1e",
    gap: 12,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    flex: 1,
    color: "#ccc",
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#222",
  },
  footerText: {
    fontSize: 9,
    color: "#444",
    letterSpacing: 2,
  },
});
