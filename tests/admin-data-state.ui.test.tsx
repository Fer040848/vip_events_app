import React from "react";
import { act, create } from "react-test-renderer";
import type { ReactTestRenderer } from "react-test-renderer";
import { TouchableOpacity } from "react-native";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminErrorState, AdminLoadingState } from "@/components/admin-data-state";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function renderedText(renderer: ReactTestRenderer) {
  return JSON.stringify(renderer.toJSON());
}

describe("estados de interfaz administrativa", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renderiza un estado de carga con el mensaje de actividad solicitado", () => {
    let renderer: ReactTestRenderer;

    act(() => {
      renderer = create(<AdminLoadingState label="Sincronizando accesos VIP…" />);
    });

    expect(renderedText(renderer!)).toContain("Preparando el panel");
    expect(renderedText(renderer!)).toContain("Sincronizando accesos VIP…");
  });

  it("muestra el aviso de conexión y activa un reintento manual", async () => {
    const onRetry = vi.fn().mockResolvedValue(undefined);
    let renderer: ReactTestRenderer;

    await act(async () => {
      renderer = create(<AdminErrorState onRetry={onRetry} />);
    });

    expect(renderedText(renderer!)).toContain("Sin conexión. Reintentaremos automáticamente (1/2).");
    const retryButton = renderer!.root.findByType(TouchableOpacity);

    await act(async () => {
      retryButton.props.onPress();
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(renderedText(renderer!)).toContain("Reintentar ahora");
  });

  it("inicia reintentos automáticos limitados cuando falla la consulta", async () => {
    vi.useFakeTimers();
    const onRetry = vi.fn().mockResolvedValue(undefined);
    let renderer: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <AdminErrorState onRetry={onRetry} autoRetryDelayMs={100} maxAutoRetries={1} />,
      );
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(renderedText(renderer!)).toContain("Seguimos sin conexión. Puedes volver a intentarlo cuando estés listo.");
  });
});
