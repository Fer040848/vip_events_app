import { Component, useCallback, useEffect, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type LoadingStateProps = {
  label?: string;
};

export function AdminLoadingState({ label = "Actualizando información privada…" }: LoadingStateProps) {
  return (
    <View style={styles.stateContainer} accessibilityRole="progressbar" accessibilityLabel={label}>
      <View style={styles.loadingGlyph}>
        <ActivityIndicator color="#C9A84C" size="small" />
      </View>
      <Text style={styles.loadingTitle}>Preparando el panel</Text>
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  );
}

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry: () => void | Promise<unknown>;
  autoRetryDelayMs?: number;
  maxAutoRetries?: number;
};

type OfflineBannerProps = {
  cachedAt?: string;
  isRefreshing?: boolean;
  onRetry: () => void | Promise<unknown>;
};

export function AdminOfflineBanner({ cachedAt, isRefreshing = false, onRetry }: OfflineBannerProps) {
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (attempt >= 2 || isRefreshing) return;
    const timer = setTimeout(() => {
      setAttempt((current) => current + 1);
      void onRetry();
    }, 3000);
    return () => clearTimeout(timer);
  }, [attempt, isRefreshing, onRetry]);

  const savedLabel = cachedAt
    ? new Date(cachedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
    : "anterior";

  return (
    <View style={styles.offlineBanner} accessibilityRole="alert">
      <View style={styles.offlineDot} />
      <View style={styles.offlineTextGroup}>
        <Text style={styles.offlineTitle}>Sin conexión · datos guardados</Text>
        <Text style={styles.offlineDescription}>
          {isRefreshing
            ? "Reconectando de forma segura…"
            : attempt < 2
              ? `Puedes seguir consultando la última actualización (${savedLabel}). Reintentando…`
              : `Puedes seguir consultando la última actualización (${savedLabel}).`}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          setAttempt(0);
          void onRetry();
        }}
        style={styles.offlineRetryButton}
        disabled={isRefreshing}
        activeOpacity={0.78}
      >
        <Text style={styles.offlineRetryText}>{isRefreshing ? "…" : "↻"}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function AdminErrorState({
  title = "No pudimos cargar esta información",
  description = "Tus datos no se han modificado. Revisa tu conexión e inténtalo nuevamente.",
  onRetry,
  autoRetryDelayMs = 2500,
  maxAutoRetries = 2,
}: ErrorStateProps) {
  const [autoAttempts, setAutoAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(
    async (isAutomatic = false) => {
      setIsRetrying(true);
      if (isAutomatic) setAutoAttempts((attempts) => attempts + 1);
      try {
        await onRetry();
      } finally {
        setIsRetrying(false);
      }
    },
    [onRetry],
  );

  useEffect(() => {
    if (autoAttempts >= maxAutoRetries || isRetrying) return;
    const timer = setTimeout(() => void retry(true), autoRetryDelayMs);
    return () => clearTimeout(timer);
  }, [autoAttempts, autoRetryDelayMs, isRetrying, maxAutoRetries, retry]);

  const connectionMessage = isRetrying
    ? "Reconectando de forma segura…"
    : autoAttempts < maxAutoRetries
      ? `Sin conexión. Reintentaremos automáticamente (${autoAttempts + 1}/${maxAutoRetries}).`
      : "Seguimos sin conexión. Puedes volver a intentarlo cuando estés listo.";

  return (
    <View style={styles.stateContainer} accessibilityRole="alert">
      <View style={styles.errorGlyph}>
        <Text style={styles.errorGlyphText}>!</Text>
      </View>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorDescription}>{description}</Text>
      <View style={styles.connectionNotice} accessibilityLiveRegion="polite">
        <View style={[styles.connectionDot, isRetrying && styles.connectionDotRetrying]} />
        <Text style={styles.connectionText}>{connectionMessage}</Text>
      </View>
      <TouchableOpacity
        style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
        onPress={() => {
          setAutoAttempts(0);
          void retry();
        }}
        disabled={isRetrying}
        activeOpacity={0.82}
      >
        <Text style={styles.retryButtonText}>{isRetrying ? "Reconectando…" : "Reintentar ahora"}</Text>
      </TouchableOpacity>
    </View>
  );
}

type BoundaryProps = {
  children: ReactNode;
};

type BoundaryState = {
  hasError: boolean;
};

export class AdminErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[AdminErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.boundaryContainer}>
          <AdminErrorState
            title="El panel necesita recargarse"
            description="La navegación se mantiene protegida. Puedes volver a intentar cargar esta sección."
            onRetry={() => this.setState({ hasError: false })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  boundaryContainer: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: "#0A0A0A",
  },
  loadingGlyph: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C9A84C1F",
    borderWidth: 1,
    borderColor: "#C9A84C55",
    marginBottom: 16,
  },
  loadingTitle: {
    color: "#F5E6C8",
    fontSize: 18,
    fontWeight: "800",
  },
  loadingLabel: {
    color: "#8A7A5A",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 6,
  },
  errorGlyph: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C9A84C1F",
    borderWidth: 1,
    borderColor: "#C9A84C55",
    marginBottom: 16,
  },
  errorGlyphText: {
    color: "#C9A84C",
    fontSize: 26,
    fontWeight: "800",
  },
  errorTitle: {
    color: "#F5E6C8",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  errorDescription: {
    color: "#8A7A5A",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 300,
  },
  connectionNotice: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 14,
    maxWidth: 310,
  },
  connectionDot: {
    backgroundColor: "#E74C3C",
    borderRadius: 4,
    height: 8,
    marginRight: 8,
    width: 8,
  },
  connectionDotRetrying: {
    backgroundColor: "#C9A84C",
  },
  connectionText: {
    color: "#8A7A5A",
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: "#C9A84C",
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginTop: 20,
  },
  retryButtonDisabled: {
    opacity: 0.6,
  },
  retryButtonText: {
    color: "#0A0A0A",
    fontSize: 13,
    fontWeight: "800",
  },
  offlineBanner: {
    alignItems: "center",
    backgroundColor: "#C9A84C18",
    borderBottomColor: "#C9A84C44",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  offlineDot: {
    backgroundColor: "#C9A84C",
    borderRadius: 4,
    height: 8,
    marginRight: 9,
    width: 8,
  },
  offlineTextGroup: {
    flex: 1,
  },
  offlineTitle: {
    color: "#F5E6C8",
    fontSize: 12,
    fontWeight: "800",
  },
  offlineDescription: {
    color: "#8A7A5A",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  offlineRetryButton: {
    alignItems: "center",
    borderColor: "#C9A84C66",
    borderRadius: 14,
    borderWidth: 1,
    height: 28,
    justifyContent: "center",
    marginLeft: 10,
    width: 28,
  },
  offlineRetryText: {
    color: "#C9A84C",
    fontSize: 17,
    fontWeight: "800",
  },
});
