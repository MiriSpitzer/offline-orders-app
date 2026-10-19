import type { Item, Order, RemoteStore } from "./types";

async function errorMessage(res: Response, fallback: string) {
  try {
    const data = await res.json();
    if (data?.error) return `${fallback}: ${data.error}`;
  } catch {}
  return `${fallback} (HTTP ${res.status})`;
}

export async function fetchItems(): Promise<Item[]> {
  const res = await fetch("/api/items", { cache: "no-store" });
  if (!res.ok) throw new Error(await errorMessage(res, "Could not fetch products"));
  return res.json();
}

export async function fetchStores(): Promise<RemoteStore[]> {
  const res = await fetch("/api/stores", { cache: "no-store" });
  if (!res.ok) throw new Error(await errorMessage(res, "Could not fetch stores"));
  return res.json();
}

export function toZohoSalesOrder(order: Order) {
  return {
    customer_id: order.store_id,
    date: order.date,
    reference_number: order.id,
    line_items: order.lines.map((l) => ({
      item_id: l.item_id,
      quantity: l.quantity,
      rate: l.rate,
    })),
  };
}

export class OfflineError extends Error {
  constructor() {
    super("No connection to Zoho");
  }
}

export async function sendOrder(order: Order): Promise<{ salesorder_id: string }> {
  if (!navigator.onLine) throw new OfflineError();

  let res: Response;
  try {
    res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toZohoSalesOrder(order)),
    });
  } catch {
    throw new OfflineError();
  }
  if (res.status === 503) {
    const data = await res.clone().json().catch(() => null);
    if (data?.offline) throw new OfflineError();
  }
  if (!res.ok) throw new Error(await errorMessage(res, "Zoho did not accept the order"));
  return res.json();
}
