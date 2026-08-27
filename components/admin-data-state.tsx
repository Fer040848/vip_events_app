import { Component, type ErrorInfo, type ReactNode } from "react";
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
  onRetry: () => void;
};

export function AdminErrorState({
  title = "No pudimos cargar esta información",
  description = "Tus datos no se han modificado. Revisa tu conexión e inténtalo nuevamente.",
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.stateContainer} accessibilityRole="alert">
      <View style={styles.errorGlyph}>
        <Text style={styles.errorGlyphText}>!</Text>
      </View>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorDescription}>{description}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.82}>
        <Text style={styles.retryButtonText}>Reintentar</Text>
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
  retryButton: {
    backgroundColor: "#C9A84C",
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginTop: 20,
  },
  retryButtonText: {
    color: "#0A0A0A",
    fontSize: 13,
    fontWeight: "800",
  },
});
