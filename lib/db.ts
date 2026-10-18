// Local database in the browser (IndexedDB) via Dexie.
// Everything the app needs offline lives here.

import Dexie, { type EntityTable } from "dexie";
import type { Item, MetaEntry, Order, Store } from "./types";

export const db = new Dexie("ZohoOrderApp") as Dexie & {
  items: EntityTable<Item, "item_id">;
  orders: EntityTable<Order, "id">;
  meta: EntityTable<MetaEntry, "key">;
  stores: EntityTable<Store, "store_id">;
};

// First field = primary key, the rest are indexes you can query on.
// Changing this later? Bump the version number: db.version(4).stores({...})
db.version(1).stores({
  items: "item_id, group_id, category_name, name",
  contacts: "contact_id, contact_name",
  orders: "id, status, contact_id, created_at",
  meta: "key",
});

// v2: store layouts (drag-and-drop category order per shop).
db.version(2).stores({
  items: "item_id, group_id, category_name, name",
  contacts: "contact_id, contact_name",
  orders: "id, status, contact_id, created_at",
  meta: "key",
  stores: "store_id, name",
});

// v3: customers ARE the stores — drop the separate contacts table and fold
// any previously-synced contacts into stores (keeping layouts already set).
db.version(3)
  .stores({
    items: "item_id, group_id, category_name, name",
    orders: "id, status, store_id, created_at",
    meta: "key",
    stores: "store_id, name",
    contacts: null,
  })
  .upgrade(async (tx) => {
    const contacts = await tx.table("contacts").toArray();
    const existingStores = await tx.table("stores").toArray();
    const existingIds = new Set(existingStores.map((s) => s.store_id));
    const items = await tx.table("items").toArray();
    const categoryOrder = Array.from(new Set(items.map((i) => i.category_name))).sort((a, b) =>
      a.localeCompare(b)
    );

    const toAdd = contacts
      .filter((c) => !existingIds.has(c.contact_id))
      .map((c) => ({ store_id: c.contact_id, name: c.contact_name, categoryOrder }));
    if (toAdd.length) await tx.table("stores").bulkAdd(toAdd);
  });
