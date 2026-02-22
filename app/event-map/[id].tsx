import { trpc } from "@/lib/trpc";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export default function EventMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const eventId = parseInt(id ?? "0");

  const { data: event, isLoading } = trpc.events.get.useQuery({ id: eventId });

  const handleOpenMaps = () => {
    if (!event?.location) return;
    const query = encodeURIComponent(event.location);
    const url =
      Platform.OS === "ios" ? `maps:?q=${query}` : `geo:0,0?q=${query}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://maps.google.com/?q=${query}`);
    });
  };

  const handleOpenWaze = () => {
    if (!event?.location) return;
    const query = encodeURIComponent(event.location);
    Linking.openURL(`https://waze.com/ul?q=${query}&navigate=yes`).catch(() => {
      Linking.openURL(`https://maps.google.com/?q=${query}`);
    });
  };

  const handleOpenGoogleMaps = () => {
    if (!event?.location) return;
    const query = encodeURIComponent(event.location);
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  if (isLoading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.centered}>
          <ActivityIndicator color="#C9A84C" size="large" />
          <Text style={styles.loadingText}>Cargando mapa...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!event) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.centered}>
          <Text style={styles.errorText}>Evento no encontrado</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Regresar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // Build static map image URL (no API key needed for basic embed)
  const locationQuery = event.location
    ? encodeURIComponent(event.location)
    : null;
  const staticMapUrl = locationQuery
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${locationQuery}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${locationQuery}&key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY`
    : null;

  return (
    <ScreenContainer
      containerClassName="bg-background"
      edges={["top", "left", "right"]}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Regresar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {event.title}
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Map Placeholder — opens Google Maps on tap */}
          <TouchableOpacity
            style={styles.mapContainer}
            onPress={handleOpenGoogleMaps}
            activeOpacity={0.85}
          >
            <View style={styles.mapPlaceholder}>
              <View style={styles.mapPinContainer}>
                <Text style={styles.mapPinEmoji}>📍</Text>
                <View style={styles.mapPinShadow} />
              </View>
              <View style={styles.mapGrid}>
                {/* Decorative grid lines to simulate a map */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <View key={`h${i}`} style={[styles.gridLineH, { top: `${i * 25}%` as any }]} />
                ))}
                {[0, 1, 2, 3, 4].map((i) => (
                  <View key={`v${i}`} style={[styles.gridLineV, { left: `${i * 25}%` as any }]} />
                ))}
              </View>
              <View style={styles.mapOverlay}>
                <Text style={styles.mapOverlayText}>🗺️ Toca para abrir en Google Maps</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Location Info */}
          <View style={styles.locationCard}>
            <Text style={styles.locationLabel}>📍 Ubicación del evento</Text>
            <Text style={styles.locationText}>
              {event.location ?? "Por confirmar"}
            </Text>
            {event.locationInstructions && (
              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsLabel}>
                  🗺️ Indicaciones de llegada
                </Text>
                <Text style={styles.instructionsText}>
                  {event.locationInstructions}
                </Text>
              </View>
            )}
          </View>

          {/* Event Info */}
          <View style={styles.eventInfoCard}>
            <View style={styles.eventInfoRow}>
              <Text style={styles.eventInfoIcon}>📅</Text>
              <View>
                <Text style={styles.eventInfoLabel}>Fecha y hora</Text>
                <Text style={styles.eventInfoValue}>
                  {new Date(event.date).toLocaleDateString("es-MX", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.eventInfoRow}>
              <Text style={styles.eventInfoIcon}>🎉</Text>
              <View>
                <Text style={styles.eventInfoLabel}>Tipo de evento</Text>
                <Text style={styles.eventInfoValue}>
                  Barra libre · Evento VIP exclusivo
                </Text>
              </View>
            </View>
          </View>

          {/* Navigation Buttons */}
          {event.location && (
            <View style={styles.navSection}>
              <Text style={styles.navTitle}>Abrir con...</Text>
              <View style={styles.navButtons}>
                <TouchableOpacity
                  style={[styles.navBtn, styles.mapsBtn]}
                  onPress={handleOpenMaps}
                >
                  <Text style={styles.navBtnIcon}>🍎</Text>
                  <Text style={styles.navBtnText}>Apple Maps</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.navBtn, styles.googleBtn]}
                  onPress={handleOpenGoogleMaps}
                >
                  <Text style={styles.navBtnIcon}>🗺️</Text>
                  <Text style={styles.navBtnText}>Google Maps</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.navBtn, styles.wazeBtn]}
                  onPress={handleOpenWaze}
                >
                  <Text style={styles.navBtnIcon}>🚗</Text>
                  <Text style={styles.navBtnText}>Waze</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    color: "#8A7A5A",
    fontSize: 14,
  },
  errorText: {
    color: "#F5E6C8",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  backBtnText: {
    color: "#C9A84C",
    fontSize: 13,
    fontWeight: "600",
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  mapContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    height: 200,
    borderWidth: 1,
    borderColor: "#C9A84C33",
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  mapGrid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#2A2A2A",
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#2A2A2A",
  },
  mapPinContainer: {
    alignItems: "center",
    zIndex: 2,
  },
  mapPinEmoji: {
    fontSize: 48,
  },
  mapPinShadow: {
    width: 20,
    height: 6,
    backgroundColor: "#00000066",
    borderRadius: 10,
    marginTop: -4,
  },
  mapOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0A0A0ACC",
    paddingVertical: 10,
    alignItems: "center",
  },
  mapOverlayText: {
    color: "#C9A84C",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  locationCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 10,
  },
  locationLabel: {
    fontSize: 11,
    color: "#C9A84C",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  locationText: {
    fontSize: 15,
    color: "#F5E6C8",
    fontWeight: "600",
    lineHeight: 22,
  },
  instructionsBox: {
    backgroundColor: "#0A0A0A",
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  instructionsLabel: {
    fontSize: 11,
    color: "#C9A84C",
    fontWeight: "700",
  },
  instructionsText: {
    fontSize: 13,
    color: "#8A7A5A",
    lineHeight: 20,
  },
  eventInfoCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 12,
  },
  eventInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  eventInfoIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  eventInfoLabel: {
    fontSize: 11,
    color: "#8A7A5A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  eventInfoValue: {
    fontSize: 13,
    color: "#F5E6C8",
    fontWeight: "600",
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#2A2A2A",
  },
  navSection: {
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  navTitle: {
    fontSize: 13,
    color: "#8A7A5A",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  navButtons: {
    flexDirection: "row",
    gap: 10,
  },
  navBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  mapsBtn: {
    backgroundColor: "#1A1A1A",
    borderColor: "#2A2A2A",
  },
  googleBtn: {
    backgroundColor: "#1A1A1A",
    borderColor: "#2A2A2A",
  },
  wazeBtn: {
    backgroundColor: "#1A1A1A",
    borderColor: "#2A2A2A",
  },
  navBtnIcon: {
    fontSize: 24,
  },
  navBtnText: {
    color: "#F5E6C8",
    fontSize: 11,
    fontWeight: "600",
  },
});
