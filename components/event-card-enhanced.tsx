import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface EventCardEnhancedProps {
  id: number;
  name: string;
  date: string;
  location: string;
  attendees: number;
  image?: string;
  onPress: () => void;
  isPaid?: boolean;
}

export function EventCardEnhanced({
  id,
  name,
  date,
  location,
  attendees,
  image,
  onPress,
  isPaid = false,
}: EventCardEnhancedProps) {
  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.pressable,
        {
          transform: [{ scale: pressed ? 0.97 : 1 }],
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <LinearGradient
        colors={["#A08030", "#C9A84C", "#F5D78E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.overlay}>
          {image && (
            <Image
              source={{ uri: image }}
              style={styles.image}
              contentFit="cover"
            />
          )}

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={2}>{name}</Text>
              {isPaid && (
                <View style={styles.paidBadge}>
                  <Text style={styles.paidText}>✓ Pagado</Text>
                </View>
              )}
            </View>

            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📅</Text>
                <Text style={styles.detailText}>{date}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📍</Text>
                <Text style={styles.detailText}>{location}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>👥</Text>
                <Text style={styles.detailText}>{attendees} invitados</Text>
              </View>
            </View>

            <View style={styles.ctaButton}>
              <Text style={styles.ctaText}>Ver detalles →</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  gradient: {
    borderRadius: 16,
    overflow: "hidden",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    padding: 16,
  },
  image: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  content: {
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    paddingRight: 8,
  },
  paidBadge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  details: {
    gap: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailIcon: {
    fontSize: 14,
  },
  detailText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
  },
  ctaButton: {
    backgroundColor: "#C9A84C",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    alignItems: "center",
  },
  ctaText: {
    color: "#0A0A0A",
    fontWeight: "bold",
    fontSize: 14,
  },
});
