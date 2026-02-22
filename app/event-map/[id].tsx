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
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import MapView, { Marker } from "react-native-maps";

export default function EventMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const eventId = parseInt(id ?? "0");

  const { data: event, isLoading } = trpc.events.get.useQuery({ id: eventId });

  const handleOpenMaps = () => {
    if (!event?.location) return;
    const query = encodeURIComponent(event.location);
    const url = Platform.OS === "ios"
      ? `maps:?q=${query}`
      : `geo:0,0?q=${query}`;
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
          <ActivityIndicator color="#C9A84C" />
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

  // Try to parse lat/lng if available
  const lat = event.locationLat ? parseFloat(event.locationLat as string) : null;
  const lng = event.locationLng ? parseFloat(event.locationLng as string) : null;
  const hasCoords = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);

  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Regresar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{event.title}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Map */}
          {hasCoords ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: lat!,
                  longitude: lng!,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{ latitude: lat!, longitude: lng! }}
                  title={event.title}
                  description={event.location ?? ""}
                  pinColor="#C9A84C"
                />
              </MapView>
            </View>
          ) : (
            <View style={styles.noMapContainer}>
              <Text style={styles.noMapIcon}>🗺️</Text>
              <Text style={styles.noMapText}>Mapa no disponible</Text>
              <Text style={styles.noMapSub}>Usa los botones de abajo para navegar</Text>
            </View>
          )}

          {/* Location Info */}
          <View style={styles.locationCard}>
            <Text style={styles.locationLabel}>📍 Ubicación del evento</Text>
            <Text style={styles.locationText}>{event.location ?? "Por confirmar"}</Text>
            {event.locationInstructions && (
              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsLabel}>🗺️ Indicaciones de llegada</Text>
                <Text style={styles.instructionsText}>{event.locationInstructions}</Text>
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
                    weekday: "long", day: "numeric", month: "long",
                    year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.eventInfoRow}>
              <Text style={styles.eventInfoIcon}>🎉</Text>
              <View>
                <Text style={styles.eventInfoLabel}>Tipo de evento</Text>
                <Text style={styles.eventInfoValue}>Barra libre · Evento VIP exclusivo</Text>
              </View>
            </View>
          </View>

          {/* Navigation Buttons */}
          {event.location && (
            <View style={styles.navSection}>
              <Text style={styles.navTitle}>Abrir con...</Text>
              <View style={styles.navButtons}>
                <TouchableOpacity style={[styles.navBtn, styles.mapsBtn]} onPress={handleOpenMaps}>
                  <Text style={styles.navBtnIcon}>🍎</Text>
                  <Text style={styles.navBtnText}>Apple Maps</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navBtn, styles.googleBtn]} onPress={handleOpenGoogleMaps}>
                  <Text style={styles.navBtnIcon}>🗺️</Text>
                  <Text style={styles.navBtnText}>Google Maps</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navBtn, styles.wazeBtn]} onPress={handleOpenWaze}>
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
    height: 220,
    borderWidth: 1,
    borderColor: "#C9A84C33",
  },
  map: {
    flex: 1,
  },
  noMapContainer: {
    marginHorizontal: 16,
    height: 180,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  noMapIcon: {
    fontSize: 48,
  },
  noMapText: {
    color: "#F5E6C8",
    fontSize: 16,
    fontWeight: "700",
  },
  noMapSub: {
    color: "#8A7A5A",
    fontSize: 12,
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
