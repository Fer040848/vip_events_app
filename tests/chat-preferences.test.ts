import { describe, expect, it } from "vitest";

import { DEFAULT_CHAT_PREFERENCES, normalizeChatPreferences } from "@/lib/chat-preferences";

describe("preferencias de banners del chat", () => {
  it("mantiene los banners habilitados cuando no hay datos guardados", () => {
    expect(normalizeChatPreferences(null)).toEqual(DEFAULT_CHAT_PREFERENCES);
  });

  it("restaura la preferencia explícita de silenciar banners", () => {
    expect(normalizeChatPreferences({ bannersEnabled: false })).toEqual({ bannersEnabled: false });
  });

  it("ignora valores inválidos para proteger la experiencia predeterminada", () => {
    expect(normalizeChatPreferences({ bannersEnabled: "no" })).toEqual(DEFAULT_CHAT_PREFERENCES);
  });
});
