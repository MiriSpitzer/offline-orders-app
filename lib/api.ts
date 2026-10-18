// The "data source" layer. The rest of the app doesn't know where the data comes from.
// Now: mock data. Later: fetch() to your own Next.js route handlers,
// which in turn talk to the Zoho Inventory API.

import { mockItems, mockStores, type RemoteStore } from "./mock-data";
import type { Item, Order } from "./types";

// Simulates network latency so you can test loading states.
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchItems(): Promise<Item[]> {
  await wait(400);
  return mockItems;
  // Later:
  // const res = await fetch("/api/items");
  // if (!res.ok) throw new Error("Could not fetch products");
  // return res.json();
}

// The importer's customers are the stores. Only id + name come from Zoho;
// each store's layout (categoryOrder) is managed locally (see lib/sync.ts).
export async function fetchStores(): Promise<RemoteStore[]> {
  await wait(300);
  return mockStores;
  // Later: fetch("/api/contacts")
}

/**
 * Converts a local order to the format of a Zoho sales order.
 * reference_number = our own unique ID, so you can recognize duplicate orders.
 */
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

export async function sendOrder(order: Order): Promise<{ salesorder_id: string }> {
  if (!navigator.onLine) throw new Error("No internet connection");

  const payload = toZohoSalesOrder(order);
  await wait(600);
  console.log("[mock] Sales order to Zoho:", payload);
  return { salesorder_id: "SO-" + order.id.slice(0, 8) };

  // Later:
  // const res = await fetch("/api/orders", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(payload),
  // });
  // if (!res.ok) throw new Error(await res.text());
  // return res.json();
}
