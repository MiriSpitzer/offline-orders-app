// Two-way synchronization:
// 1. syncMasterData: fetch products and stores (customers) -> local database
// 2. sendPendingOrders: send pending orders -> Zoho

import { fetchItems, fetchStores, sendOrder } from "./api";
import { db } from "./db";
import { isForcedOffline } from "./devOffline";

export async function syncMasterData() {
  const [items, remoteStores] = await Promise.all([fetchItems(), fetchStores()]);
  const categoryOrder = Array.from(new Set(items.map((i) => i.category_name))).sort((a, b) =>
    a.localeCompare(b)
  );

  // In one transaction: if a step fails, the old data stays in place.
  await db.transaction("rw", db.items, db.stores, db.meta, async () => {
    await db.items.clear();
    await db.items.bulkPut(items);

    // Keep each store's existing layout; only brand-new stores get the default order.
    const existingById = new Map((await db.stores.toArray()).map((s) => [s.store_id, s]));
    const stores = remoteStores.map((r) => ({
      store_id: r.store_id,
      name: r.name,
      categoryOrder: existingById.get(r.store_id)?.categoryOrder ?? categoryOrder,
    }));
    await db.stores.clear();
    await db.stores.bulkPut(stores);

    await db.meta.put({ key: "lastSync", value: Date.now() });
  });

  return { items: items.length, stores: remoteStores.length };
}

let sending = false; // prevents two syncs from running at the same time

export async function sendPendingOrders() {
  if (sending || !navigator.onLine || isForcedOffline()) return { sent: 0, failed: 0 };
  sending = true;

  let sent = 0;
  let failed = 0;

  try {
    const pending = await db.orders
      .where("status")
      .anyOf("pending", "failed")
      .sortBy("created_at");

    for (const order of pending) {
      await db.orders.update(order.id, { status: "sending", error: undefined });
      try {
        const result = await sendOrder(order);
        await db.orders.update(order.id, {
          status: "sent",
          zoho_salesorder_id: result.salesorder_id,
        });
        sent++;
      } catch (err) {
        await db.orders.update(order.id, {
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        });
        failed++;
      }
    }
  } finally {
    sending = false;
  }

  return { sent, failed };
}

/** Resets orders stuck on "sending" (e.g. page closed) back to pending. */
export async function resetStuckOrders() {
  await db.orders.where("status").equals("sending").modify({ status: "pending" });
}
