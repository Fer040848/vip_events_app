import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

type ChatNotificationBannerProps = {
  title?: string | null;
  body?: string | null;
  onPress: () => void;
  onDismiss: () => void;
};

export function ChatNotificationBanner({ title, body, onPress, onDismiss }: ChatNotificationBannerProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-14)).current;

  useEffect(() => {
    const enter = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]);
    enter.start();
    const timeout = setTimeout(onDismiss, 5_000);
    return () => {
      enter.stop();
      clearTimeout(timeout);
    };
  }, [onDismiss, opacity, translateY]);

  return (
    <Animated.View style={[styles.wrapper, { opacity, transform: [{ translateY }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir mensaje nuevo del chat general"
        onPress={onPress}
        style={({ pressed }) => [styles.banner, pressed && styles.bannerPressed]}
      >
        <View style={styles.marker}><Text style={styles.markerText}>CHAT</Text></View>
        <View style={styles.textContent}>
          <Text style={styles.title} numberOfLines={1}>{title || "Nuevo mensaje"}</Text>
          <Text style={styles.body} numberOfLines={2}>{body || "Toca para abrir el chat general."}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar aviso" onPress={onDismiss} hitSlop={10}>
          <Text style={styles.close}>×</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", top: 14, left: 16, right: 16, zIndex: 2000 },
  banner: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#C9A84C", borderRadius: 14 },
  bannerPressed: { opacity: 0.82 },
  marker: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#2B230F" },
  markerText: { color: "#C9A84C", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  textContent: { flex: 1, gap: 2 },
  title: { color: "#F5E6C8", fontSize: 13, fontWeight: "700" },
  body: { color: "#B7A98D", fontSize: 12, lineHeight: 16 },
  close: { color: "#C9A84C", fontSize: 24, fontWeight: "300", lineHeight: 28, paddingHorizontal: 2 },
});
