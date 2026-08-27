import { existsSync, readFileSync } from "node:fs";
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

  it("alerta solo a administradores y expone el contador de comprobantes pendientes", () => {
    const router = source("server/routers.ts");
    const drawer = source("components/sidebar-drawer.tsx");
    const adminNotifications = source("app/(admin)/notifications.tsx");

    expect(router).toContain("getAdminPushTokens()");
    expect(router).toContain("pendingConfirmationCount: protectedProcedure");
    expect(drawer).toContain("pendingConfirmationCount.useQuery");
    expect(adminNotifications).toContain("Comprobantes por revisar");
  });

  it("permite a cada miembro consultar únicamente el estado de sus propios comprobantes", () => {
    const router = source("server/routers.ts");
    const profile = source("app/(tabs)/profile.tsx");

    expect(router).toContain("myConfirmations: protectedProcedure.query(({ ctx }) => db.getPaymentConfirmationsForUser(ctx.user.id))");
    expect(profile).toContain("PAYMENT_PROOF_STATUS");
    expect(profile).toContain("trpc.payments.myConfirmations.useQuery");
  });

  it("muestra estados de carga y una recuperación segura si el panel no puede obtener datos", () => {
    const appLayout = source("app/_layout.tsx");
    const adminLayout = source("app/(admin)/_layout.tsx");
    const dashboard = source("app/(admin)/index.tsx");
    const events = source("app/(admin)/events.tsx");

    expect(appLayout).toContain("<StartupGate>");
    expect(adminLayout).toContain("<AdminErrorBoundary>");
    expect(dashboard).toContain("<AdminErrorState onRetry={retryDashboard}");
    expect(events).toContain("<AdminLoadingState");
    expect(events).toContain("<AdminErrorState");
  });

  it("retira las rutas Firebase obsoletas y usa tRPC para invitados", () => {
    const guests = source("app/(admin)/guests.tsx");
    const packageJson = source("package.json");

    expect(guests).toContain("trpc.admin.users.useQuery");
    expect(guests).not.toContain("useGuestsManagement");
    expect(packageJson).not.toContain('"firebase"');
    expect(existsSync(resolve(process.cwd(), "app/(admin)/events-edit.tsx"))).toBe(false);
    expect(existsSync(resolve(process.cwd(), "hooks/use-events.ts"))).toBe(false);
    expect(existsSync(resolve(process.cwd(), "hooks/use-guests-management.ts"))).toBe(false);
  });
});
