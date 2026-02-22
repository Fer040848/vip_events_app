import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import * as Haptics from "expo-haptics";

export default function SetupNameScreen() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const updateName = trpc.users.updateName.useMutation();
  const utils = trpc.useUtils();

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (trimmed.length > 50) {
      setError("El nombre no puede tener más de 50 caracteres.");
      return;
    }

    setError(null);
    try {
      await updateName.mutateAsync({ name: trimmed });
      // Invalidate user cache
      await utils.auth.me.invalidate();
      await utils.users.me.invalidate();

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Navigate based on role
      const role = (user as any)?.role;
      if (role === "admin") {
        router.replace("/(admin)");
      } else {
        router.replace("/(tabs)");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar el nombre";
      setError(msg);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  return (
    <ScreenContainer containerClassName="bg-black" edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>✨</Text>
            </View>
            <Text style={styles.title}>¡Bienvenido!</Text>
            <Text style={styles.subtitle}>
              Personaliza cómo aparecerás en el chat y en la plataforma VIP.
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>¿Cómo te llamas?</Text>
            <Text style={styles.cardSubtitle}>
              Este nombre será visible para otros invitados en el chat exclusivo.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>TU NOMBRE</Text>
              <TextInput
                ref={inputRef}
                style={[styles.input, error ? styles.inputError : null]}
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  setError(null);
                }}
                placeholder="Ej: Carlos, María, DJ Alex..."
                placeholderTextColor="#555"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSave}
                maxLength={50}
                autoFocus
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            {/* Preview */}
            {name.trim().length > 0 && (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>VISTA PREVIA EN EL CHAT</Text>
                <View style={styles.previewBubble}>
                  <View style={styles.previewAvatar}>
                    <Text style={styles.previewAvatarText}>
                      {name.trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.previewMessage}>
                    <Text style={styles.previewName}>{name.trim()}</Text>
                    <Text style={styles.previewText}>¡Hola a todos! 🎉</Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, (updateName.isPending || !name.trim()) ? styles.buttonDisabled : null]}
              onPress={handleSave}
              disabled={updateName.isPending || !name.trim()}
              activeOpacity={0.8}
            >
              {updateName.isPending ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.buttonText}>CONTINUAR →</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Skip */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => {
              const role = (user as any)?.role;
              if (role === "admin") {
                router.replace("/(admin)");
              } else {
                router.replace("/(tabs)");
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Continuar sin personalizar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: "#000",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1a1500",
    borderWidth: 2,
    borderColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#C9A84C",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#C9A84C",
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2a2200",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#888",
    lineHeight: 18,
    marginBottom: 24,
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
    fontSize: 17,
    color: "#fff",
    fontWeight: "500",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 8,
  },
  preview: {
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 10,
    color: "#555",
    letterSpacing: 2,
    marginBottom: 10,
  },
  previewBubble: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  previewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  previewAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  previewMessage: {
    backgroundColor: "#111",
    borderRadius: 12,
    borderBottomLeftRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: "#222",
    maxWidth: "80%",
  },
  previewName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#C9A84C",
    marginBottom: 3,
  },
  previewText: {
    fontSize: 13,
    color: "#ddd",
  },
  button: {
    backgroundColor: "#C9A84C",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#C9A84C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  buttonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    color: "#555",
    fontSize: 13,
  },
});
