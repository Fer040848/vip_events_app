export type VipOrderExportItem = {
  id: number;
  userName: string | null;
  userCode: string | null;
  eventTitle: string | null;
  items: string | null;
  status: string | null;
  notes: string | null;
  createdAt: Date | string;
};

export type VipCatalogItem = {
  id: number;
  name: string;
  price: string | number;
};

function escapeCsv(value: string | number | null | undefined) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function getItemIds(serializedItems: string | null) {
  try {
    const decoded: unknown = JSON.parse(serializedItems ?? "[]");
    return Array.isArray(decoded) ? decoded.map(String) : [];
  } catch {
    return [];
  }
}

export function createVipOrdersCsv(orders: VipOrderExportItem[], catalog: VipCatalogItem[]) {
  const productsById = new Map(catalog.map((product) => [product.id.toString(), product]));
  const header = [
    "Pedido",
    "Miembro",
    "Código de acceso",
    "Evento",
    "Productos",
    "Total (MXN)",
    "Estado",
    "Notas",
    "Fecha",
  ];

  const rows = orders.map((order) => {
    const products = getItemIds(order.items).map((itemId) => productsById.get(itemId)).filter(Boolean) as VipCatalogItem[];
    const productNames = products.map((product) => product.name).join(" · ") || "Producto no disponible";
    const total = products.reduce((sum, product) => sum + Number(product.price), 0).toFixed(2);
    const createdAt = new Date(order.createdAt).toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    return [
      order.id,
      order.userName ?? "Miembro VIP",
      order.userCode?.replace("code_", "") ?? "",
      order.eventTitle ?? "Evento VIP",
      productNames,
      total,
      order.status ?? "pending",
      order.notes ?? "",
      createdAt,
    ].map(escapeCsv).join(",");
  });

  return `\uFEFF${header.map(escapeCsv).join(",")}\n${rows.join("\n")}`;
}
