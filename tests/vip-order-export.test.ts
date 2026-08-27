import { describe, expect, it } from "vitest";

import { createVipOrdersCsv } from "../lib/vip-order-export";

describe("createVipOrdersCsv", () => {
  it("incluye columnas, productos, total y escapa los valores de forma segura", () => {
    const csv = createVipOrdersCsv([
      {
        id: 12,
        userName: "Ana \"VIP\"",
        userCode: "code_tlc006",
        eventTitle: "After Room",
        items: "[\"1\",\"2\"]",
        status: "confirmed",
        notes: "Mesa junto a la cabina",
        createdAt: "2026-08-27T12:00:00.000Z",
      },
    ], [
      { id: 1, name: "Champagne", price: "1500.00" },
      { id: 2, name: "Mesa privada", price: 800 },
    ]);

    expect(csv).toContain('"Código de acceso"');
    expect(csv).toContain('"Ana ""VIP"""');
    expect(csv).toContain('"Champagne · Mesa privada"');
    expect(csv).toContain('"2300.00"');
    expect(csv).toContain('"tlc006"');
  });
});
