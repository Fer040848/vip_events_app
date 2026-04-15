import { useEffect } from "react";
import * as ScreenCapture from "expo-screen-capture";
import { Alert, Platform } from "react-native";

export function useScreenProtection() {
  useEffect(() => {
    if (Platform.OS === "web") return;

    // Prevent screenshots using the hook
    const preventScreenshot = async () => {
      try {
        await ScreenCapture.usePreventScreenCapture();
      } catch (error) {
        console.error("Error preventing screenshots:", error);
      }
    };

    // Listen for screenshot attempts
    const subscription = ScreenCapture.addScreenshotListener(() => {
      Alert.alert(
        "Screenshot Bloqueado",
        "No se permiten capturas de pantalla en esta aplicación por razones de seguridad.",
        [{ text: "Entendido", onPress: () => {} }]
      );
    });

    preventScreenshot();

    return () => {
      subscription.remove();
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);
}
