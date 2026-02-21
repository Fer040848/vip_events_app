import { trpc } from "@/lib/trpc";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useState, useRef } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  TextInput,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export default function AdminScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [manualCode, setManualCode] = useState("");
  const [mode, setMode] = useState<"camera" | "manual">(
    Platform.OS === "web" ? "manual" : "camera"
  );

  const scanQr = trpc.invitations.scanQr.useQuery(
    { qrCode: scanResult?.qrCode ?? "" },
    { enabled: !!scanResult?.qrCode }
  );

  const checkIn = trpc.invitations.checkIn.useMutation({
    onSuccess: () => {
      Alert.alert("✅ Check-in exitoso", "El invitado ha sido registrado correctamente.", [
        { text: "OK", onPress: () => { setScanned(false); setScanResult(null); } },
      ]);
    },
    onError: (err) => Alert.alert("Error", err.message),
  });

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScanResult({ qrCode: data });
  };

  const handleManualSearch = () => {
    if (!manualCode.trim()) return;
    setScanResult({ qrCode: manualCode.trim() });
  };

  const handleCheckIn = () => {
    if (!scanResult?.qrCode) return;
    checkIn.mutate({ qrCode: scanResult.qrCode });
  };

  const handleReset = () => {
    setScanned(false);
    setScanResult(null);
    setManualCode("");
  };

  const scanData = scanQr.data;

  if (mode === "camera" && !permission) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Cargando cámara...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (mode === "camera" && !permission?.granted) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.centered}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Permiso de cámara requerido</Text>
          <Text style={styles.permissionText}>
            Necesitamos acceso a la cámara para escanear los códigos QR de los invitados.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Permitir acceso</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => setMode("manual")}
          >
            <Text style={styles.manualBtnText}>Ingresar código manualmente</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Escáner QR</Text>
          <View style={styles.modeSwitcher}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === "camera" && styles.modeBtnActive]}
              onPress={() => { setMode("camera"); handleReset(); }}
            >
              <Text style={[styles.modeBtnText, mode === "camera" && styles.modeBtnTextActive]}>
                Cámara
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === "manual" && styles.modeBtnActive]}
              onPress={() => { setMode("manual"); handleReset(); }}
            >
              <Text style={[styles.modeBtnText, mode === "manual" && styles.modeBtnTextActive]}>
                Manual
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Camera or Manual Input */}
        {!scanResult ? (
          mode === "camera" ? (
            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.camera}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={handleBarCodeScanned}
              />
              <View style={styles.cameraOverlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.scanHint}>Apunta al código QR del invitado</Text>
              </View>
            </View>
          ) : (
            <View style={styles.manualContainer}>
              <Text style={styles.manualLabel}>Código QR del invitado</Text>
              <TextInput
                style={styles.manualInput}
                value={manualCode}
                onChangeText={setManualCode}
                placeholder="Ej: VIP-1234567890-ABC123"
                placeholderTextColor="#8A7A5A"
                autoCapitalize="characters"
                returnKeyType="search"
                onSubmitEditing={handleManualSearch}
              />
              <TouchableOpacity
                style={styles.searchBtn}
                onPress={handleManualSearch}
                disabled={!manualCode.trim()}
              >
                <Text style={styles.searchBtnText}>Buscar invitado</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          /* Scan Result */
          <View style={styles.resultContainer}>
            {scanQr.isLoading ? (
              <View style={styles.centered}>
                <Text style={styles.loadingText}>Buscando invitado...</Text>
              </View>
            ) : !scanData ? (
              <View style={styles.resultCard}>
                <Text style={styles.resultIcon}>❌</Text>
                <Text style={styles.resultTitle}>QR no encontrado</Text>
                <Text style={styles.resultSubtitle}>
                  El código "{scanResult.qrCode}" no corresponde a ninguna invitación.
                </Text>
                <TouchableOpacity style={styles.retryBtn} onPress={handleReset}>
                  <Text style={styles.retryBtnText}>Intentar de nuevo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.resultCard}>
                {/* Status */}
                <View
                  style={[
                    styles.resultStatusBadge,
                    {
                      backgroundColor:
                        scanData.invitation?.status === "paid"
                          ? "#27AE6022"
                          : scanData.invitation?.status === "checked_in"
                          ? "#8A7A5A22"
                          : "#F39C1222",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.resultStatusText,
                      {
                        color:
                          scanData.invitation?.status === "paid"
                            ? "#27AE60"
                            : scanData.invitation?.status === "checked_in"
                            ? "#8A7A5A"
                            : "#F39C12",
                      },
                    ]}
                  >
                    {scanData.invitation?.status === "paid"
                      ? "✓ PAGADO — PUEDE INGRESAR"
                      : scanData.invitation?.status === "checked_in"
                      ? "⚠ YA INGRESÓ"
                      : "✗ NO PAGADO"}
                  </Text>
                </View>

                {/* Guest Info */}
                <View style={styles.guestInfo}>
                  <View style={styles.guestAvatar}>
                    <Text style={styles.guestAvatarText}>
                      {scanData.user?.name ? scanData.user.name[0].toUpperCase() : "?"}
                    </Text>
                  </View>
                  <View style={styles.guestDetails}>
                    <Text style={styles.guestName}>{scanData.user?.name ?? "Sin nombre"}</Text>
                    <Text style={styles.guestEmail}>{scanData.user?.email ?? ""}</Text>
                  </View>
                </View>

                {/* Event Info */}
                {scanData.event && (
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventInfoLabel}>Evento</Text>
                    <Text style={styles.eventInfoTitle}>{scanData.event.title}</Text>
                    <Text style={styles.eventInfoDate}>
                      {new Date(scanData.event.date).toLocaleDateString("es-MX", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </Text>
                  </View>
                )}

                {/* QR Code */}
                <Text style={styles.qrCodeText}>{scanResult.qrCode}</Text>

                {/* Actions */}
                <View style={styles.resultActions}>
                  {scanData.invitation?.status === "paid" && (
                    <TouchableOpacity
                      style={styles.checkInBtn}
                      onPress={handleCheckIn}
                      disabled={checkIn.isPending}
                    >
                      <Text style={styles.checkInBtnText}>
                        {checkIn.isPending ? "Registrando..." : "✓ Registrar Check-in"}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.retryBtn} onPress={handleReset}>
                    <Text style={styles.retryBtnText}>Escanear otro</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
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
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F5E6C8",
    letterSpacing: 0.5,
  },
  modeSwitcher: {
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  modeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modeBtnActive: {
    backgroundColor: "#C9A84C",
  },
  modeBtnText: {
    fontSize: 12,
    color: "#8A7A5A",
    fontWeight: "600",
  },
  modeBtnTextActive: {
    color: "#0A0A0A",
    fontWeight: "700",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: "#C9A84C",
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  scanHint: {
    color: "#F5E6C8",
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  manualContainer: {
    padding: 20,
    gap: 16,
  },
  manualLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  manualInput: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    color: "#F5E6C8",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },
  searchBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  searchBtnText: {
    color: "#0A0A0A",
    fontSize: 15,
    fontWeight: "700",
  },
  resultContainer: {
    flex: 1,
    padding: 20,
  },
  resultCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 16,
  },
  resultIcon: {
    fontSize: 60,
    textAlign: "center",
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F5E6C8",
    textAlign: "center",
  },
  resultSubtitle: {
    fontSize: 13,
    color: "#8A7A5A",
    textAlign: "center",
    lineHeight: 20,
  },
  resultStatusBadge: {
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  resultStatusText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  guestInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#0A0A0A",
    borderRadius: 14,
    padding: 14,
  },
  guestAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
  },
  guestAvatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0A0A0A",
  },
  guestDetails: {
    flex: 1,
    gap: 4,
  },
  guestName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  guestEmail: {
    fontSize: 12,
    color: "#8A7A5A",
  },
  eventInfo: {
    backgroundColor: "#0A0A0A",
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  eventInfoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#C9A84C",
    letterSpacing: 0.5,
  },
  eventInfoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F5E6C8",
  },
  eventInfoDate: {
    fontSize: 12,
    color: "#8A7A5A",
    textTransform: "capitalize",
  },
  qrCodeText: {
    fontSize: 11,
    color: "#8A7A5A",
    fontFamily: "monospace",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  resultActions: {
    gap: 10,
  },
  checkInBtn: {
    backgroundColor: "#27AE60",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  checkInBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  retryBtn: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  retryBtnText: {
    color: "#F5E6C8",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingText: {
    color: "#8A7A5A",
    fontSize: 14,
  },
  permissionIcon: {
    fontSize: 60,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F5E6C8",
    textAlign: "center",
  },
  permissionText: {
    fontSize: 13,
    color: "#8A7A5A",
    textAlign: "center",
    lineHeight: 20,
  },
  permissionBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  permissionBtnText: {
    color: "#0A0A0A",
    fontSize: 15,
    fontWeight: "700",
  },
  manualBtn: {
    paddingVertical: 12,
  },
  manualBtnText: {
    color: "#C9A84C",
    fontSize: 14,
    fontWeight: "600",
  },
});
