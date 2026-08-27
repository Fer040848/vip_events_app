import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf-8");

describe("contratos de acceso privado y administración", () => {
  it("mantiene la navegación administrativa en un drawer sin barra inferior", () => {
    const layout = source("app/(admin)/_layout.tsx");

    expect(layout).toContain("<SidebarDrawer isAdmin onClose={closeDrawer} />");
    expect(layout).toContain('drawerPosition="left"');
    expect(layout).toContain('display: "none"');
    expect(layout).toContain('name="payment-links"');
    expect(layout).toContain('name="orders"');
  });

  it("mantiene un catálogo VIP separado de los pedidos y disponible para miembros autenticados", () => {
    const schema = source("drizzle/schema.ts");
    const router = source("server/routers.ts");
    const memberMenu = source("app/(tabs)/vip-orders.tsx");

    expect(schema).toContain('mysqlTable("vip_products"');
    expect(router).toContain("list: protectedProcedure.query(() => db.getVipProducts())");
    expect(memberMenu).toContain("trpc.vipProducts.list.useQuery");
    expect(memberMenu).toContain("trpc.vipOrders.create.useMutation");
  });

  it("registra el checkout privado en servidor y elimina botones de compartir de Mi QR", () => {
    const router = source("server/routers.ts");
    const qrScreen = source("app/(tabs)/my-qr.tsx");

    expect(router).toContain("openLink: protectedProcedure");
    expect(router).toContain("recordPaymentLinkClick");
    expect(qrScreen).toContain("trpc.payments.openLink.useMutation");
    expect(qrScreen).not.toContain("whatsapp://");
    expect(qrScreen).not.toContain("Share.share");
  });

  it("activa la protección contra capturas en el layout raíz", () => {
    const rootLayout = source("app/_layout.tsx");
    expect(rootLayout).toContain("useScreenProtection()");
  });
});
